import { createHash } from "crypto";
import { FastifyInstance } from "fastify";
import { isMatcherReady, lookupAlias, matchOne, type MatchCandidate } from "../food-matcher.js";
import { logMatcherQuery } from "../matcher-query-log.js";

// ─── Types ───

interface ParseRequest {
  text: string;
  // existingDishNames is accepted for forward compatibility (Full phase). Ignored in MVP.
  existingDishNames?: Array<{ id: string; name: string }>;
}

interface LLMItem {
  type?: "product" | "dish";
  name: string;
  note?: string;
  quantity: number | null;
  time: string | null;
}

interface ResolvedItem {
  productId: string;
  name: string;
  originalName: string;
  note: string;
  quantity: number;
  time: string;
  confidence: number;
  quantityGuessed?: boolean;
}

interface AmbiguousItem {
  originalName: string;
  note: string;
  quantity: number;
  time: string;
  candidates: MatchCandidate[];
  quantityGuessed?: boolean;
}

interface UnresolvedItem {
  originalName: string;
  note: string;
  quantity: number;
  time: string;
  quantityGuessed?: boolean;
}

interface ParseResponse {
  resolved: ResolvedItem[];
  ambiguous: AmbiguousItem[];
  unresolved: UnresolvedItem[];
}

// ─── Thresholds (calibrated from probe-parse logs 2026-04 ───
//
// e5-small на русском выдаёт узкий диапазон score (0.83–0.91). Типичный
// margin top1-top2 для корректного top-1 — 0.003–0.008. Раньше было 0.02 →
// 83% запросов падали в ambiguous даже когда top-1 был правильный.
// Новый порог 0.003 оставляет место для реально сомнительных (margin < 0.003 =
// почти ничья, честно показать пользователю кандидатов).
const SCORE_FLOOR = 0.8;
const AUTO_ACCEPT_MARGIN = 0.003;

// ─── Quantity fallback ───

const QUANTITY_FALLBACK_G = 100;

// ─── LLM response cache ───

const LLM_CACHE_TTL_MS = 10 * 60 * 1000;
const LLM_CACHE_MAX = 200;

const llmCache = new Map<string, { items: LLMItem[]; expiresAt: number }>();

function cacheKey(text: string): string {
  return createHash("sha1").update(text.trim().toLowerCase()).digest("hex");
}

function getCachedLLM(text: string): LLMItem[] | null {
  const key = cacheKey(text);
  const entry = llmCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    llmCache.delete(key);
    return null;
  }
  return entry.items;
}

function setCachedLLM(text: string, items: LLMItem[]): void {
  if (llmCache.size >= LLM_CACHE_MAX) {
    // Drop the oldest entry (insertion order).
    const firstKey = llmCache.keys().next().value;
    if (firstKey) llmCache.delete(firstKey);
  }
  llmCache.set(cacheKey(text), { items, expiresAt: Date.now() + LLM_CACHE_TTL_MS });
}

// ─── Rate limit (shared with dish suggestions: 30/hour/IP per плану) ───

const RATE_LIMIT = parseInt(process.env.FREE_TEXT_RATE_LIMIT ?? "30", 10);
const RATE_WINDOW_MS = 60 * 60 * 1000;

const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─── LLM ───

const SYSTEM_PROMPT = `Ты — помощник по питанию. Пользователь описал, что он ел.
Разбери текст на список элементов. Верни JSON и НИЧЕГО кроме JSON:

{
  "items": [
    {
      "type": "product",
      "name": "каноничное название продукта на русском",
      "note": "уточняющая информация или пустая строка",
      "quantity": число_в_граммах,
      "time": "HH:MM" или null
    }
  ]
}

Правила:
- В MVP всё считай как product (даже борщ — продукт; составные блюда обработаем позже).
- quantity: оцени в граммах; для поштучных переведи (1 банан ≈ 120г, 1 яйцо ≈ 60г, 1 кусок хлеба ≈ 30г). Если совсем не можешь оценить — верни 0, подставим дефолт на бэкенде.
- time: если есть прямое или контекстное указание, ОБЯЗАТЕЛЬНО заполни:
    "утром" / "на завтрак" → "08:00"
    "днём" / "в обед"       → "13:00"
    "полдник"                → "16:00"
    "вечером" / "на ужин"    → "19:00"
    явное "в 10:30" и т.п.   → "10:30"
  Null — только если в тексте нет вообще никакой привязки ко времени.
- note: уточняющая информация, всё что не является каноничным названием продукта:
    "бурый рис 200г" → name: "рис", note: "бурый"
    "творог 5%" → name: "творог", note: "5%"
    "сельдь солёная" → name: "сельдь", note: "солёная"
    "куриная грудка на гриле" → name: "куриная грудка", note: "на гриле"
    "просто банан" → name: "банан", note: ""
  Пустая строка, если уточнений нет.
- name: ОБЯЗАТЕЛЬНО в канонической форме:
    • именительный падеж, единственное число (кроме продуктов, у которых только мн.ч.: макароны, сливки, дрожжи)
    • "ё" заменяй на "е" (мёд → мед, свёкла → свекла, зелёный → зеленый)
    • без уменьшительных: картошечка → картофель, творожок → творог, бананчик → банан,
      огурчик → огурец, яблочко → яблоко, хлебушек → хлеб, булочка → булка, сырок → сыр,
      рыбка → рыба, курочка → курица
    • без предлогов и лишних слов: "с бананом" → "банан", "из творога" → "творог", "без масла" → "масло"
    • канонический синоним вместо сленга: картоха → картофель, кишмиш → изюм, урюк → курага
    • слова порядок не важен, но без прилагательных состояния ("варёный", "жареный", "тушёный")
      если они не являются частью канонического названия продукта
    Примеры:
      "съел помидорчиков" → name: "помидор"
      "с куриной грудкой" → name: "куриная грудка"
      "попил молочка" → name: "молоко"
      "варёное яйцо" → name: "яйцо"
- Не добавляй комментариев, объяснений, markdown — только чистый JSON.`;

async function callLLM(text: string): Promise<LLMItem[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const model = process.env.SUGGESTION_MODEL ?? "deepseek/deepseek-chat";

  const MAX_RETRIES = 3;
  let response!: Response;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1500 * attempt));
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (response.status !== 429) break;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty LLM response");

  let jsonStr = String(content).trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  const parsed = JSON.parse(jsonStr);
  const items: LLMItem[] = Array.isArray(parsed?.items) ? parsed.items : [];
  // Keep every item with a non-empty name. Zero/missing quantity is filled in later.
  return items.filter((i) => typeof i?.name === "string" && i.name.trim());
}

// ─── Time defaults ───

const DEFAULT_SLOTS = ["08:00", "13:00", "16:00", "19:00"];

function isValidTime(t: unknown): t is string {
  return typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

function fillDefaultTimes(items: LLMItem[]): string[] {
  // Walk left-to-right; if missing, take next default slot after the last used time.
  const filled: string[] = new Array(items.length);
  let slotIdx = 0;
  let lastTime: string | null = null;
  for (let i = 0; i < items.length; i++) {
    const t = items[i].time;
    if (isValidTime(t)) {
      filled[i] = t;
      lastTime = t;
      // Bump slotIdx past any default slots ≤ lastTime.
      while (slotIdx < DEFAULT_SLOTS.length && DEFAULT_SLOTS[slotIdx] <= lastTime) slotIdx++;
    } else {
      const candidate = DEFAULT_SLOTS[Math.min(slotIdx, DEFAULT_SLOTS.length - 1)];
      filled[i] = candidate;
      lastTime = candidate;
      slotIdx = Math.min(slotIdx + 1, DEFAULT_SLOTS.length - 1);
    }
  }
  return filled;
}

// ─── Pipeline ───

async function resolveItems(items: LLMItem[], phrase: string): Promise<ParseResponse> {
  const times = fillDefaultTimes(items);

  const resolved: ResolvedItem[] = [];
  const ambiguous: AmbiguousItem[] = [];
  const unresolved: UnresolvedItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const time = times[i];
    const note = typeof item.note === "string" ? item.note.trim() : "";

    const rawQty = typeof item.quantity === "number" && isFinite(item.quantity) ? item.quantity : 0;
    const quantityGuessed = rawQty <= 0;
    const quantity = quantityGuessed ? QUANTITY_FALLBACK_G : Math.round(rawQty);

    const alias = lookupAlias(item.name);
    if (alias) {
      logMatcherQuery({
        phrase,
        originalName: item.name,
        verdict: "alias",
        top: [{ id: alias.id, name: alias.name, score: alias.score }],
        margin: null,
      });
      resolved.push({
        productId: alias.id,
        name: alias.name,
        originalName: item.name,
        note,
        quantity,
        time,
        confidence: alias.score,
        ...(quantityGuessed ? { quantityGuessed: true } : {}),
      });
      continue;
    }

    const candidates = await matchOne(item.name, 3);
    const top = candidates[0];
    const second = candidates[1];

    if (!top) {
      logMatcherQuery({ phrase, originalName: item.name, verdict: "unresolved", top: [], margin: null });
      unresolved.push({
        originalName: item.name,
        note,
        quantity,
        time,
        ...(quantityGuessed ? { quantityGuessed: true } : {}),
      });
      continue;
    }

    const margin = second ? top.score - second.score : 1;
    const aboveFloor = top.score >= SCORE_FLOOR;
    const confident = aboveFloor && margin >= AUTO_ACCEPT_MARGIN;

    const verdict: "resolved" | "ambiguous" | "unresolved" = confident
      ? "resolved"
      : aboveFloor
        ? "ambiguous"
        : "unresolved";

    logMatcherQuery({
      phrase,
      originalName: item.name,
      verdict,
      top: candidates.map((c) => ({ id: c.id, name: c.name, score: c.score })),
      margin,
    });

    if (verdict === "resolved") {
      resolved.push({
        productId: top.id,
        name: top.name,
        originalName: item.name,
        note,
        quantity,
        time,
        confidence: top.score,
        ...(quantityGuessed ? { quantityGuessed: true } : {}),
      });
    } else if (verdict === "ambiguous") {
      ambiguous.push({
        originalName: item.name,
        note,
        quantity,
        time,
        candidates,
        ...(quantityGuessed ? { quantityGuessed: true } : {}),
      });
    } else {
      unresolved.push({
        originalName: item.name,
        note,
        quantity,
        time,
        ...(quantityGuessed ? { quantityGuessed: true } : {}),
      });
    }
  }

  return { resolved, ambiguous, unresolved };
}

// ─── Routes ───

export async function freeTextFoodRoutes(app: FastifyInstance) {
  app.post<{ Body: ParseRequest }>("/parse", async (req, reply) => {
    const { text } = req.body ?? {};

    if (!text || typeof text !== "string" || !text.trim()) {
      return reply.status(400).send({ error: "text is required" });
    }

    if (text.length > 2000) {
      return reply.status(400).send({ error: "text too long (max 2000 chars)" });
    }

    if (!isMatcherReady()) {
      return reply.status(503).send({
        error: "Food matcher is still initializing. Please retry in a few seconds.",
      });
    }

    if (!checkRateLimit(req.ip)) {
      return reply.status(429).send({
        error: `Rate limit exceeded. Max ${RATE_LIMIT} requests per hour.`,
      });
    }

    try {
      const cached = getCachedLLM(text);
      let items: LLMItem[];
      if (cached) {
        items = cached;
        app.log.info({ textPreview: text.slice(0, 80) }, "free-text-food/parse cache hit");
      } else {
        items = await callLLM(text);
        setCachedLLM(text, items);
        app.log.info(
          { textPreview: text.slice(0, 80), itemCount: items.length },
          "free-text-food/parse LLM parsed"
        );
      }
      if (items.length === 0) {
        return reply.send({ resolved: [], ambiguous: [], unresolved: [] });
      }
      const result = await resolveItems(items, text);
      return reply.send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      app.log.error(`free-text-food/parse error: ${message}`);
      return reply.status(500).send({ error: message });
    }
  });
}
