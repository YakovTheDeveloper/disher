import { randomUUID } from "crypto";
import { FastifyInstance } from "fastify";
import { isMatcherReady } from "../food-matcher.js";
import { logLLMOutput } from "../llm-output-log.js";
import { getLLMModel } from "../build-info.js";
import { resolveNames, type LLMItem, LLM_ITEMS_JSON_SCHEMA } from "../resolve-names.js";

// ─── Head A: "infer recipe" ───
//
// Dish name → typical ingredients as CANONICAL product names + grams (+ prep
// details). The LLM never sees the catalog (Вариант Б): it emits the same
// `LLMItem[]` head B (free-text-food) emits, and the shared `resolveNames`
// matches each name against the catalog → resolved / ambiguous / unresolved.
// The frontend renders the result in the SAME предложка (InlineWriteFoodReview)
// as the home screen, committing into the dish via `addDishItem`.
//
// No dedup against existing dish items (deliberate, 2026-06-04): the user wipes
// duplicates in the предложка. "Add the same product twice" is allowed
// everywhere else in the app, so suggestions just match that.

interface SuggestDishProductsRequest {
  dishName: string;
}

// ─── Rate limit (30/hour/IP, mirrors free-text-food) ───

const RATE_LIMIT = parseInt(process.env.SUGGESTIONS_RATE_LIMIT ?? "30", 10);
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

// ─── LLM recipe cache (keyed by normalized dish name) ───
//
// Caches the head-A `LLMItem[]`, not the ParseResponse — `resolveNames` re-runs
// each call so requestId stays fresh for telemetry (mirrors free-text-food).

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 200;

// Bump when SYSTEM_PROMPT meaningfully changes so recipes cached under the old
// contract can't leak through (mirrors free-text-food's PROMPT_VERSION).
// v2 (2026-06-05): added "include the dish base, not just sauce/dressing" rule
// (цезарь was returning only the dressing).
const PROMPT_VERSION = 2;

const llmCache = new Map<string, { items: LLMItem[]; expiresAt: number }>();

function normalizeName(name: string): string {
  return `${name.toLowerCase().trim()}|v${PROMPT_VERSION}`;
}

function getCachedLLM(key: string): LLMItem[] | null {
  const entry = llmCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    llmCache.delete(key);
    return null;
  }
  return entry.items;
}

function setCachedLLM(key: string, items: LLMItem[]): void {
  if (llmCache.size >= CACHE_MAX) {
    const firstKey = llmCache.keys().next().value;
    if (firstKey) llmCache.delete(firstKey);
  }
  llmCache.set(key, { items, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── LLM ───

const SYSTEM_PROMPT = `Ты — кулинарный помощник. Пользователь назвал блюдо.
Перечисли продукты, которые обычно входят в это блюдо (одна типичная порция).
Верни JSON и НИЧЕГО кроме JSON:

{
  "items": [
    {
      "type": "product",
      "name": "каноничное название продукта на русском",
      "details": "способ приготовления / особенность через запятую, или пустая строка",
      "quantity": число_в_граммах,
      "time": null
    }
  ]
}

Правила:
- Перечисли ВСЕ ингредиенты, включая соль, специи, масло, воду — пользователь сам уберёт лишнее.
- ОБЯЗАТЕЛЬНО включай основу блюда — белок (мясо/рыбу/яйца), базу (крупу/макароны/хлеб)
  и главные овощи. НЕ ограничивайся только соусом или заправкой.
    "цезарь" → куриное филе, листья салата, сухарики, сыр пармезан, ПЛЮС заправка (яйцо, масло, лимон, чеснок)
    "борщ" → свекла, капуста, картофель, мясо, ПЛЮС зажарка и специи
- Предлагай 5-15 продуктов в зависимости от блюда.
- quantity: граммы на одну типичную порцию блюда (например свёкла в борще ≈ 80г).
- time: всегда null — для блюда время приёма не нужно.
- details: способ приготовления или особенность продукта ИМЕННО в этом блюде,
  через запятую, lowercase, или пустая строка. Не угадывай — только очевидное.
    "борщ" → name: "свекла", details: "вареная"
    "оливье" → name: "картофель", details: "вареный"
    "греческий салат" → name: "помидор", details: ""
- name: ОБЯЗАТЕЛЬНО в канонической форме:
    • именительный падеж, единственное число (кроме продуктов только мн.ч.: макароны, сливки, дрожжи)
    • "ё" заменяй на "е" (свёкла → свекла, мёд → мед)
    • без уменьшительных: картошечка → картофель, творожок → творог, лучок → лук
    • без прилагательных состояния ("варёный", "жареный") — они в details, не в name
    Примеры: name: "куриная грудка", "картофель", "морковь", "лук", "томатная паста"
- Не добавляй комментариев, объяснений, markdown — только чистый JSON.`;

interface LLMCallResult {
  items: LLMItem[];
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalCost?: number;
}

async function callLLM(dishName: string): Promise<LLMCallResult> {
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
          { role: "user", content: `Блюдо: "${dishName}"` },
        ],
        // temp 0.3: same as head B — stabler recipes + cache (canon 2026-06-04).
        temperature: 0.3,
        // Strict structured output (shared schema, same as head B).
        response_format: { type: "json_schema", json_schema: LLM_ITEMS_JSON_SCHEMA },
        provider: { require_parameters: true },
      }),
    });
    if (response.status !== 429) break;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - startedAt;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty LLM response");

  // Defensive fence-strip: strict json_schema should return pure JSON, but keep
  // the fence-strip + tolerant JSON.parse as belt-and-suspenders.
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

export async function suggestionsRoutes(app: FastifyInstance) {
  app.post<{ Body: SuggestDishProductsRequest }>(
    "/dish-products",
    async (req, reply) => {
      const { dishName } = req.body ?? {};

      if (!dishName || typeof dishName !== "string" || !dishName.trim()) {
        return reply.status(400).send({ error: "dishName is required" });
      }

      if (dishName.length > 200) {
        return reply.status(400).send({ error: "dishName too long (max 200 chars)" });
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

      const requestId = randomUUID();
      const cacheKey = normalizeName(dishName);

      try {
        const cached = getCachedLLM(cacheKey);
        let items: LLMItem[];
        if (cached) {
          items = cached;
          app.log.info({ dishName, requestId }, "suggestions/dish-products cache hit");
          logLLMOutput({
            requestId,
            model: getLLMModel(),
            phrase: dishName,
            itemsReturned: items,
            cached: true,
            latencyMs: 0,
          });
        } else {
          const result = await callLLM(dishName);
          items = result.items;
          setCachedLLM(cacheKey, items);
          app.log.info(
            { dishName, itemCount: items.length, requestId, latencyMs: result.latencyMs },
            "suggestions/dish-products LLM inferred"
          );
          logLLMOutput({
            requestId,
            model: getLLMModel(),
            phrase: dishName,
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

        const response = await resolveNames(items, dishName, requestId);
        return reply.send(response);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        app.log.error(`Suggestion error: ${message}`);
        return reply.status(500).send({ error: message });
      }
    }
  );
}
