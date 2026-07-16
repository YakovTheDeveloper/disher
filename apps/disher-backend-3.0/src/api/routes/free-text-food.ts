import { createHash } from "crypto";
import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { isMatcherReady } from "../food-matcher.js";
import { logLLMOutput } from "../llm-output-log.js";
import { getLLMModel } from "../build-info.js";
import { resolveNames, type LLMItem, LLM_ITEMS_JSON_SCHEMA } from "../resolve-names.js";
import { chargeOr402, resolveRequestId } from "../../billing/http.js";
import { refund } from "../../billing/wallet.js";
import { aiProviderError } from "../errors.js";

// ─── Types ───

interface ParseRequest {
  text: string;
  // existingDishNames is accepted for forward compatibility (Full phase). Ignored in MVP.
  existingDishNames?: Array<{ id: string; name: string }>;
}

// ─── LLM response cache ───

const LLM_CACHE_TTL_MS = 10 * 60 * 1000;
const LLM_CACHE_MAX = 200;

// Bump whenever SYSTEM_PROMPT meaningfully changes — older cached LLM outputs
// were produced under a different contract and would otherwise leak through.
// v2 (2026-05-12): renamed `note` → `details`, broadened the field to cover
// prep method / aging / source / marinade / peel / cuisine style.
// v3 (2026-06-05): switched model→deepseek-v4-flash + strict json_schema —
// outputs from the old model/format must not leak through the cache.
const PROMPT_VERSION = 3;

const llmCache = new Map<string, { items: LLMItem[]; expiresAt: number }>();

function cacheKey(text: string): string {
  return createHash("sha1")
    .update(`${text.trim().toLowerCase()}|v${PROMPT_VERSION}`)
    .digest("hex");
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

// ─── Rate limit (30/hour/IP). NB: the suggestions route keeps its OWN separate
// budget (not a shared limiter) — a user effectively gets 30 here + 30 there. ───

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
      "details": "детали приготовления и особенности через запятую, или пустая строка",
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
- details: детали приготовления и особенности продукта, дословно как сказано в тексте.
  Что класть в details (через запятую, lowercase):
    • Способ готовки: «жареное», «варёное», «тушёное», «на пару», «запечённое», «фритюр», «на гриле».
    • Жир/масло: «без масла», «на гхи», «на сливочном», «во фритюре».
    • Выдержка / зрелость: «выдержанный», «молодой», «свежий», «спелый», «зелёный».
    • Кожура / нарезка: «с кожурой», «без кожуры», «целиком», «мелко нарезанный».
    • Источник: «домашнее», «ресторан», «магазинное», «готовое», «фермерское».
    • Маринад / соус: «маринованное», «с соевым», «острое», «солёное».
    • Жирность/процент: «5%», «обезжиренное».
    • Стиль кухни: «индийское», «тайское», «итальянское» — только если явно сказано.
  Примеры:
    "бурый рис 200г" → name: "рис", details: "бурый"
    "творог 5%" → name: "творог", details: "5%"
    "сельдь солёная" → name: "сельдь", details: "солёная"
    "куриная грудка на гриле без масла" → name: "куриная грудка", details: "на гриле, без масла"
    "домашний борщ" → name: "борщ", details: "домашнее"
    "просто банан" → name: "банан", details: ""
  Пустая строка, если уточнений нет. Не угадывай — клади только то, что прямо сказано.
  Не клади в details название продукта или количество — они в отдельных полях.
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

interface LLMCallResult {
  items: LLMItem[];
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalCost?: number;
}

async function callLLM(text: string): Promise<LLMCallResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const model = getLLMModel();

  const MAX_RETRIES = 3;
  let response!: Response;
  const startedAt = Date.now();
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
        // temp 0.3: lower than the model default for more deterministic
        // extraction + stabler cache keys (canon decision 2026-06-04).
        temperature: 0.3,
        // Strict structured output (shared schema). require_parameters → only
        // route to providers that enforce json_schema (deepseek-v4-flash).
        response_format: { type: "json_schema", json_schema: LLM_ITEMS_JSON_SCHEMA },
        provider: { require_parameters: true },
      }),
    });
    if (response.status !== 429) break;
  }

  if (!response.ok) {
    // Raw upstream status/body is diagnostic and may echo our prompt — keep it in
    // the server log only; the client sees a stable ai_provider_error (502).
    const body = await response.text();
    throw aiProviderError(`OpenRouter error ${response.status}`, { status: response.status, body });
  }

  const data = await response.json();
  const latencyMs = Date.now() - startedAt;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty LLM response");

  let jsonStr = String(content).trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  const parsed = JSON.parse(jsonStr);
  const rawItems: LLMItem[] = Array.isArray(parsed?.items) ? parsed.items : [];
  const items = rawItems.filter((i) => typeof i?.name === "string" && i.name.trim());

  const usage = (data as { usage?: { prompt_tokens?: number; completion_tokens?: number; total_cost?: number; cost?: number } }).usage;
  return {
    items,
    latencyMs,
    ...(typeof usage?.prompt_tokens === "number" ? { promptTokens: usage.prompt_tokens } : {}),
    ...(typeof usage?.completion_tokens === "number" ? { completionTokens: usage.completion_tokens } : {}),
    ...(typeof usage?.total_cost === "number"
      ? { totalCost: usage.total_cost }
      : typeof usage?.cost === "number"
        ? { totalCost: usage.cost }
        : {}),
  };
}

// ─── Routes ───

// Shape only. The 2000-char cap and the empty-after-trim check stay in the
// handler: they are this route's semantics, and the handler already answers
// both with a specific message.
const PARSE_BODY_SCHEMA = Type.Object(
  {
    text: Type.String(),
    // Accepted for forward compatibility (Full phase), ignored in MVP — but it
    // must be declared, or Fastify's removeAdditional would strip it and the
    // spec would call a field the client legitimately sends unknown.
    existingDishNames: Type.Optional(
      Type.Array(Type.Object({ id: Type.String(), name: Type.String() })),
    ),
  },
  { additionalProperties: false, title: "FreeTextFoodParseRequest" },
);

export async function freeTextFoodRoutes(app: FastifyInstance) {
  app.post<{ Body: ParseRequest }>(
    "/parse",
    {
      schema: {
        operationId: "parseFreeTextFood",
        tags: ["free-text"],
        description:
          "Free-text meal phrase → catalog-matched items (resolved / ambiguous / unresolved). Paid.",
        security: [{ cookieSession: [] }],
        body: PARSE_BODY_SCHEMA,
      },
    },
    async (req, reply) => {
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

      const requestId = resolveRequestId(req);
      let charged = false;

      try {
        const cached = getCachedLLM(text);
        let items: LLMItem[];
        if (cached) {
          items = cached;
          app.log.info({ textPreview: text.slice(0, 80), requestId }, "free-text-food/parse cache hit");
          logLLMOutput({
            requestId,
            model: getLLMModel(),
            phrase: text,
            itemsReturned: items,
            cached: true,
            latencyMs: 0,
          });
        } else {
          // Paid step: debit before the OpenRouter call. Cache hits above are
          // free (no upstream call). req.userId is set by the requireUser
          // preHandler (added on the scope in buildApp); it's absent only in the
          // pure-pipeline unit tests, which skip billing.
          if (req.userId) {
            if (!(await chargeOr402(req, reply, "free_text_parse", requestId))) return;
            charged = true;
          }
          const result = await callLLM(text);
          items = result.items;
          setCachedLLM(text, items);
          app.log.info(
            { textPreview: text.slice(0, 80), itemCount: items.length, requestId, latencyMs: result.latencyMs },
            "free-text-food/parse LLM parsed"
          );
          logLLMOutput({
            requestId,
            model: getLLMModel(),
            phrase: text,
            itemsReturned: items,
            cached: false,
            latencyMs: result.latencyMs,
            ...(result.promptTokens !== undefined ? { promptTokens: result.promptTokens } : {}),
            ...(result.completionTokens !== undefined ? { completionTokens: result.completionTokens } : {}),
            ...(result.totalCost !== undefined ? { totalCost: result.totalCost } : {}),
          });
        }
        if (items.length === 0) {
          return reply.send({ requestId, resolved: [], ambiguous: [], unresolved: [] });
        }
        const result = await resolveNames(items, text, requestId);
        return reply.send(result);
      } catch (err) {
        // Refund a completed charge if the request failed before a usable result.
        if (charged && req.userId) {
          await refund(req.userId, "free_text_parse", requestId).catch(() => {});
        }
        const message = err instanceof Error ? err.message : "Unknown error";
        app.log.error(`free-text-food/parse error: ${message}`);
        return reply.status(500).send({ error: message });
      }
    },
  );
}
