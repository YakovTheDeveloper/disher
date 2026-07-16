import { createHash } from "crypto";
import { Type } from "@sinclair/typebox";
import { FastifyInstance } from "fastify";
import { getLLMModel } from "../build-info.js";
import { chargeOr402, resolveRequestId } from "../../billing/http.js";
import { refund } from "../../billing/wallet.js";
import { aiProviderError } from "../errors.js";

// Free-text health-EVENT parsing — the online sibling of free-text-food. The user
// describes a state / episode ("спал с 23 до 7, качество сна 6 из 10, не
// ворочался"); the LLM extracts one or more events, each = free text + an optional
// time period + a list of subjective 0..10 aspects. Unlike food there is NO catalog
// to match against — the LLM output IS the final structure, so the response has a
// single `events` bucket the client reviews and commits verbatim.

// ─── Types ───

interface ParseRequest {
  text: string;
}

interface LLMAspect {
  label: string;
  value: number;
}

interface LLMEvent {
  text: string;
  timeStart: string | null;
  timeEnd: string | null;
  aspects: LLMAspect[];
}

// ─── LLM response cache ───

const LLM_CACHE_TTL_MS = 10 * 60 * 1000;
const LLM_CACHE_MAX = 200;

// Bump whenever SYSTEM_PROMPT / the response schema meaningfully changes — older
// cached outputs were produced under a different contract and must not leak.
const PROMPT_VERSION = 1;

const llmCache = new Map<string, { events: LLMEvent[]; expiresAt: number }>();

function cacheKey(text: string): string {
  return createHash("sha1")
    .update(`${text.trim().toLowerCase()}|v${PROMPT_VERSION}`)
    .digest("hex");
}

function getCachedLLM(text: string): LLMEvent[] | null {
  const key = cacheKey(text);
  const entry = llmCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    llmCache.delete(key);
    return null;
  }
  return entry.events;
}

function setCachedLLM(text: string, events: LLMEvent[]): void {
  if (llmCache.size >= LLM_CACHE_MAX) {
    const firstKey = llmCache.keys().next().value;
    if (firstKey) llmCache.delete(firstKey);
  }
  llmCache.set(cacheKey(text), { events, expiresAt: Date.now() + LLM_CACHE_TTL_MS });
}

// ─── Rate limit (30/hour/IP) — own budget, mirrors free-text-food. ───

const RATE_LIMIT = parseInt(process.env.FREE_TEXT_EVENT_RATE_LIMIT ?? "30", 10);
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

// Strict structured output. Every property required + additionalProperties:false +
// nullable unions for optionals — the shape OpenRouter's json_schema enforces.
const LLM_EVENTS_JSON_SCHEMA = {
  name: "events",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      events: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            text: { type: "string" },
            timeStart: { type: ["string", "null"] },
            timeEnd: { type: ["string", "null"] },
            aspects: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  label: { type: "string" },
                  value: { type: "number" },
                },
                required: ["label", "value"],
              },
            },
          },
          required: ["text", "timeStart", "timeEnd", "aspects"],
        },
      },
    },
    required: ["events"],
  },
} as const;

const SYSTEM_PROMPT = `Ты — помощник по трекингу самочувствия. Пользователь описал одно или несколько событий/состояний (сон, тренировка, приём лекарства, самочувствие, настроение и т.п.).
Разбери текст на список событий. Верни JSON и НИЧЕГО кроме JSON:

{
  "events": [
    {
      "text": "краткое описание события на русском",
      "timeStart": "HH:MM" или null,
      "timeEnd": "HH:MM" или null,
      "aspects": [
        { "label": "название оценки", "value": число_0_10 }
      ]
    }
  ]
}

Правила:
- Одно СМЫСЛОВОЕ событие = один элемент. «Поспал, потом потренировался» → два события. Одно состояние с несколькими оценками («сон: качество 6, глубина 4») → одно событие с несколькими aspects.
- text: короткое описание своими словами, включая качественные факты без числовой оценки («не просыпался», «без разминки»). Не дублируй сюда время и числовые оценки — они в отдельных полях.
- timeStart / timeEnd: заполняй ТОЛЬКО при явной привязке ко времени.
    • период «с 23:00 до 7:00», «с 8 до 9» → timeStart="23:00", timeEnd="07:00".
    • один момент «в 14:30», «утром» → timeStart, timeEnd=null.
    • ключевые слова: «утром»→"08:00", «днём»/«обед»→"13:00", «вечером»→"19:00", «ночью»→"23:00".
    • нет привязки → оба null.
    Формат строго "HH:MM" в 24-часах (ведущий ноль: "07:00", не "7:00").
- aspects: субъективные оценки по шкале 0..10, где 0 — минимум/очень плохо, 10 — максимум/отлично.
    • Явную оценку бери как есть: «качество сна 6 из 10» → {"label":"Качество сна","value":6}. «7/10» → value 7.
    • Приведи шкалу к 0..10, если сказана другая: «4 из 5» → 8, «на троечку» → 5.
    • label — короткое существительное в именительном падеже с заглавной буквы («Настроение», «Энергия», «Качество сна», «Тревога»).
    • Не выдумывай оценки, которых нет в тексте. Нет числовых/оценочных характеристик → пустой массив aspects.
- Не добавляй комментариев, объяснений, markdown — только чистый JSON.`;

interface LLMCallResult {
  events: LLMEvent[];
  latencyMs: number;
}

// Round + clamp into the 0..10 domain and drop malformed aspects — belt to the
// schema's suspenders (a provider that ignores the range still can't poison Dexie).
function sanitizeAspects(raw: unknown): LLMAspect[] {
  if (!Array.isArray(raw)) return [];
  const out: LLMAspect[] = [];
  for (const a of raw) {
    const label = typeof a?.label === "string" ? a.label.trim() : "";
    const num = typeof a?.value === "number" ? a.value : Number(a?.value);
    if (!label || !Number.isFinite(num)) continue;
    out.push({ label, value: Math.max(0, Math.min(10, Math.round(num))) });
  }
  return out;
}

// "7:5" / "24:00" / "  8:00 " → normalized "HH:MM" or null. The model is told to
// send "HH:MM" but a lenient guard keeps a stray "7:00" from reaching the client.
function normalizeTime(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

function sanitizeEvents(raw: unknown): LLMEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: LLMEvent[] = [];
  for (const e of raw) {
    const text = typeof e?.text === "string" ? e.text.trim() : "";
    const aspects = sanitizeAspects(e?.aspects);
    const timeStart = normalizeTime(e?.timeStart);
    const timeEnd = normalizeTime(e?.timeEnd);
    // Drop an event that carries nothing — no text AND no aspects is noise.
    if (!text && aspects.length === 0) continue;
    // An end without a start is meaningless as a period — promote it to the start.
    out.push({
      text,
      timeStart: timeStart ?? timeEnd,
      timeEnd: timeStart ? timeEnd : null,
      aspects,
    });
  }
  return out;
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
        temperature: 0.3,
        response_format: { type: "json_schema", json_schema: LLM_EVENTS_JSON_SCHEMA },
        provider: { require_parameters: true },
      }),
    });
    if (response.status !== 429) break;
  }

  if (!response.ok) {
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
  const events = sanitizeEvents(parsed?.events);
  return { events, latencyMs };
}

// ─── Routes ───

// Shape only — the 2000-char cap and the empty-after-trim check are the
// handler's, same as the free-text-food sibling.
const PARSE_BODY_SCHEMA = Type.Object(
  { text: Type.String() },
  { additionalProperties: false, title: "FreeTextEventParseRequest" },
);

export async function freeTextEventRoutes(app: FastifyInstance) {
  app.post<{ Body: ParseRequest }>(
    "/parse",
    {
      schema: {
        operationId: "parseFreeTextEvent",
        tags: ["free-text"],
        description:
          "Free-text health-event phrase → events with aspects. The LLM output IS the final structure. Paid.",
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

      if (!checkRateLimit(req.ip)) {
        return reply.status(429).send({
          error: `Rate limit exceeded. Max ${RATE_LIMIT} requests per hour.`,
        });
      }

      const requestId = resolveRequestId(req);
      let charged = false;

      try {
        const cached = getCachedLLM(text);
        let events: LLMEvent[];
        if (cached) {
          events = cached;
          app.log.info({ textPreview: text.slice(0, 80), requestId }, "free-text-event/parse cache hit");
        } else {
          // Paid step: debit before the OpenRouter call. Cache hits are free.
          // req.userId is absent only in the pure-pipeline unit tests, which skip billing.
          if (req.userId) {
            if (!(await chargeOr402(req, reply, "free_text_event_parse", requestId))) return;
            charged = true;
          }
          const result = await callLLM(text);
          events = result.events;
          setCachedLLM(text, events);
          app.log.info(
            { textPreview: text.slice(0, 80), eventCount: events.length, requestId, latencyMs: result.latencyMs },
            "free-text-event/parse LLM parsed"
          );
        }
        return reply.send({ requestId, events });
      } catch (err) {
        if (charged && req.userId) {
          await refund(req.userId, "free_text_event_parse", requestId).catch(() => {});
        }
        const message = err instanceof Error ? err.message : "Unknown error";
        app.log.error(`free-text-event/parse error: ${message}`);
        return reply.status(500).send({ error: message });
      }
    },
  );
}
