import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { isMatcherReady } from "../food-matcher.js";
import { logLLMOutput } from "../llm-output-log.js";
import { getLLMModel } from "../build-info.js";
import { resolveNames, type LLMItem } from "../resolve-names.js";
import { chargeOr402, resolveRequestId } from "../../billing/http.js";
import { refund } from "../../billing/wallet.js";
import { aiProviderError } from "../errors.js";

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
  // Optional free-form clarification typed in the «Уточнения» drawer (e.g.
  // "вегетарианский", "без мяса, побольше овощей"). Empty/absent → identical
  // behaviour to before. Folded into the cache key so a commented request can't
  // serve (or be served) the no-comment recipe.
  comment?: string;
}

const MAX_COMMENT_LEN = 500;

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
// v3 (2026-07-31): per-item `nutrients` estimate — cached v2 items lack it.
// v4 (2026-07-31): nutrients expanded from the 8-nutrient БЖУ group to the
// full profile (mirror of the frontend's allNutrientsList) — schema change.
const PROMPT_VERSION = 4;

const llmCache = new Map<string, { items: LLMItem[]; expiresAt: number }>();

function normalizeName(name: string, comment?: string): string {
  const c = comment?.trim().toLowerCase() ?? "";
  return `${name.toLowerCase().trim()}|c:${c}|v${PROMPT_VERSION}`;
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
      "time": null,
      "nutrients": { "protein": число, "fats": число, "carbohydrates": число }
    }
  ]
}

(в примере выше nutrients сокращён — верни ВСЕ нутриенты из схемы, их ~54)

Правила:
- Перечисли ВСЕ ингредиенты, включая соль, специи, масло, воду — пользователь сам уберёт лишнее.
- ОБЯЗАТЕЛЬНО включай основу блюда — белок (мясо/рыбу/яйца), базу (крупу/макароны/хлеб)
  и главные овощи. НЕ ограничивайся только соусом или заправкой.
    "цезарь" → куриное филе, листья салата, сухарики, сыр пармезан, ПЛЮС заправка (яйцо, масло, лимон, чеснок)
    "борщ" → свекла, капуста, картофель, мясо, ПЛЮС зажарка и специи
- Предлагай 5-15 продуктов в зависимости от блюда.
- quantity: граммы на одну типичную порцию блюда (например свёкла в борще ≈ 80г).
- time: всегда null — для блюда время приёма не нужно.
- nutrients: ПОЛНЫЙ профиль на 100 г съедобной части продукта — верни ВСЕ
  нутриенты, перечисленные в схеме ответа (БЖУ, минералы, витамины,
  аминокислоты). Если нутриента в продукте практически нет или значение
  неизвестно — 0. Единицы по ключу схемы: g — граммы, mg — миллиграммы,
  μg — микрограммы, energy — ккал. Это справочная оценка, не лабораторный анализ.
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

// Per-item nutrient estimate: the FULL profile the frontend sends to head C —
// the user decided unresolved items should carry a complete profile, so head A
// duplicates the frontend's catalog statically (head C builds its schema from
// the request body, head A needs a compile-time constant).
// ⚠️ Зеркало фронтового allNutrientsList
// (apps/food-calc/src/entities/nutrient/ui/NutrientGroup/constants/constants.ts):
// name = `name`, label = `displayNameRu`, unit = `unit`. Держать в синке.
const DISH_NUTRIENT_SPEC: NutrientSpec[] = [
  // main (БЖУ)
  { name: "protein", label: "Белки", unit: "g" },
  { name: "sugar", label: "Сахар", unit: "g" },
  { name: "fats", label: "Жиры", unit: "g" },
  { name: "starch", label: "Крахмал", unit: "g" },
  { name: "carbohydrates", label: "Углеводы", unit: "g" },
  { name: "fiber", label: "Клетчатка", unit: "g" },
  { name: "energy", label: "Энергия", unit: "kcal" },
  { name: "water", label: "Вода", unit: "g" },
  // minerals
  { name: "iron", label: "Железо", unit: "mg" },
  { name: "magnesium", label: "Магний", unit: "mg" },
  { name: "phosphorus", label: "Фосфор", unit: "mg" },
  { name: "calcium", label: "Кальций", unit: "mg" },
  { name: "potassium", label: "Калий", unit: "mg" },
  { name: "sodium", label: "Натрий", unit: "mg" },
  { name: "zinc", label: "Цинк", unit: "mg" },
  { name: "copper", label: "Медь", unit: "μg" },
  { name: "manganese", label: "Марганец", unit: "μg" },
  { name: "selenium", label: "Селен", unit: "μg" },
  { name: "iodine", label: "Йод", unit: "μg" },
  // vitamins
  { name: "vitaminA", label: "Витамин A", unit: "μg" },
  { name: "vitaminB1", label: "Тиамин", unit: "mg" },
  { name: "vitaminB2", label: "Рибофлавин", unit: "mg" },
  { name: "vitaminB3", label: "Ниацин", unit: "mg" },
  { name: "vitaminB4", label: "Холин", unit: "mg" },
  { name: "vitaminB5", label: "Пантотеновая кислота", unit: "mg" },
  { name: "vitaminB6", label: "Пиридоксин", unit: "mg" },
  { name: "vitaminB7", label: "Биотин", unit: "mg" },
  { name: "vitaminB9", label: "Фолиевая кислота", unit: "μg" },
  { name: "vitaminB12", label: "Кобаламин", unit: "μg" },
  { name: "vitaminC", label: "Витамин C", unit: "mg" },
  { name: "vitaminD", label: "Витамин D", unit: "μg" },
  { name: "vitaminE", label: "Витамин E", unit: "mg" },
  { name: "vitaminK", label: "Витамин K", unit: "μg" },
  { name: "betaCarotene", label: "β-каротин", unit: "μg" },
  { name: "alphaCarotene", label: "α-каротин", unit: "μg" },
  // amino acids
  { name: "tryptophan", label: "Триптофан", unit: "g" },
  { name: "threonine", label: "Треонин", unit: "g" },
  { name: "isoleucine", label: "Изолейцин", unit: "g" },
  { name: "leucine", label: "Лейцин", unit: "g" },
  { name: "lysine", label: "Лизин", unit: "g" },
  { name: "methionine", label: "Метионин", unit: "g" },
  { name: "cystine", label: "Цистин", unit: "g" },
  { name: "phenylalanine", label: "Фенилаланин", unit: "g" },
  { name: "tyrosine", label: "Тирозин", unit: "g" },
  { name: "valine", label: "Валин", unit: "g" },
  { name: "arginine", label: "Аргинин", unit: "g" },
  { name: "histidine", label: "Гистидин", unit: "g" },
  { name: "alanine", label: "Аланин", unit: "g" },
  { name: "asparticAcid", label: "Аспарагиновая к-та", unit: "g" },
  { name: "glutamicAcid", label: "Глутаминовая к-та", unit: "g" },
  { name: "glycine", label: "Глицин", unit: "g" },
  { name: "proline", label: "Пролин", unit: "g" },
  { name: "serine", label: "Серин", unit: "g" },
  { name: "hydroxyproline", label: "Гидроксипролин", unit: "g" },
];

// Head A's json_schema: the shared items envelope PLUS a per-item `nutrients`
// object. Deliberately NOT LLM_ITEMS_JSON_SCHEMA — head B (free-text-food)
// stays nutrient-free. `nutrients` goes LAST in property order so the model
// finishes name/quantity before estimating — putting it earlier degrades the
// ingredient list itself.
const DISH_ITEMS_JSON_SCHEMA = {
  name: "dish_items",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { type: "string", enum: ["product", "dish"] },
            name: { type: "string" },
            details: { type: "string" },
            quantity: { type: ["number", "null"] },
            time: { type: ["string", "null"] },
            nutrients: nutrientValuesSchema(DISH_NUTRIENT_SPEC),
          },
          required: ["type", "name", "details", "quantity", "time", "nutrients"],
        },
      },
    },
    required: ["items"],
  },
} as const;

async function callLLM(dishName: string, comment?: string): Promise<LLMCallResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const model = getLLMModel();
  const trimmedComment = comment?.trim();
  const userContent = trimmedComment
    ? `Блюдо: "${dishName}"\nУточнение от пользователя (учти при подборе продуктов): "${trimmedComment}"`
    : `Блюдо: "${dishName}"`;

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
          { role: "user", content: userContent },
        ],
        // temp 0.3: same as head B — stabler recipes + cache (canon 2026-06-04).
        temperature: 0.3,
        // Full 54-key profile × 5–15 items: the cap guards against runaway
        // while leaving room for the largest recipe.
        max_tokens: 8000,
        // Strict structured output (head-A schema: shared envelope + nutrients).
        response_format: { type: "json_schema", json_schema: DISH_ITEMS_JSON_SCHEMA },
        provider: { require_parameters: true },
      }),
    });
    if (response.status !== 429) break;
  }

  if (!response.ok) {
    // Raw upstream status/body stays in the server log only; the client sees a
    // stable ai_provider_error (502).
    const body = await response.text();
    throw aiProviderError(`OpenRouter error ${response.status}`, { status: response.status, body });
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
  const items = rawItems
    .filter((i) => typeof i?.name === "string" && i.name.trim())
    .map((i) => {
      // Clamp the estimate at the edge so the cache stores only sane values.
      // resolveNames forwards them to unresolved items only.
      const nutrients =
        i.nutrients && typeof i.nutrients === "object"
          ? clampNutrientValues(i.nutrients, DISH_NUTRIENT_SPEC)
          : {};
      // Strip the RAW nutrients first: when the clamp drops every value
      // (e.g. {protein: 150}), returning `i` as-is would leak the unclamped
      // blob through resolveNames into the unresolved response.
      const { nutrients: _raw, ...rest } = i;
      return Object.keys(nutrients).length ? { ...rest, nutrients } : rest;
    });

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

// ─── Head C: "suggest product nutrients" ───
//
// Product name → estimated FULL nutrient profile per 100 g of edible part.
// The frontend owns the nutrient catalog and sends it (name = stable english
// key, label = RU display, unit). The backend stays nutrient-agnostic: it builds
// a STRICT json_schema dynamically from the sent names so the model returns a
// number for every nutrient (0 when absent/unknown). Values are correlational
// estimates, not lab data — the app treats nutrients as correlations.

interface NutrientSpec {
  name: string;
  label: string;
  unit: string;
}

interface SuggestProductNutrientsRequest {
  productName: string;
  nutrients: NutrientSpec[];
  // Prep method / peculiarity (e.g. "вареная") — same semantics as LLMItem's
  // `details`. Empty string = absent. Folded into the prompt and the cache key
  // so «гречка» and «гречка вареная» don't share a cached profile.
  details?: string;
}

const MAX_NUTRIENTS = 100;
const MAX_DETAILS_LEN = 200;

// Bump when NUTRIENT_SYSTEM_PROMPT meaningfully changes so values cached under
// the old contract can't leak through.
const NUTRIENT_PROMPT_VERSION = 1;
const NUTRIENT_CACHE_TTL_MS = 60 * 60 * 1000;
const NUTRIENT_CACHE_MAX = 200;

// Cache the estimated values keyed by normalized product name + details (prep
// changes the profile — «гречка» vs «гречка вареная»). The nutrient catalog is
// stable across requests, so it's not part of the key.
const nutrientCache = new Map<string, { values: Record<string, number>; expiresAt: number }>();

function normalizeNutrientKey(name: string, details?: string): string {
  const d = details?.trim().toLowerCase() ?? "";
  return `${name.toLowerCase().trim()}|d:${d}|nv${NUTRIENT_PROMPT_VERSION}`;
}

function getCachedNutrients(key: string): Record<string, number> | null {
  const entry = nutrientCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    nutrientCache.delete(key);
    return null;
  }
  return entry.values;
}

function setCachedNutrients(key: string, values: Record<string, number>): void {
  if (nutrientCache.size >= NUTRIENT_CACHE_MAX) {
    const firstKey = nutrientCache.keys().next().value;
    if (firstKey) nutrientCache.delete(firstKey);
  }
  nutrientCache.set(key, { values, expiresAt: Date.now() + NUTRIENT_CACHE_TTL_MS });
}

const NUTRIENT_SYSTEM_PROMPT = `Ты — нутрициолог со справочными таблицами состава продуктов (USDA / СНГ).
Пользователь называет продукт. Оцени содержание каждого запрошенного нутриента
на 100 г съедобной части.

Верни JSON и НИЧЕГО кроме JSON, строго по схеме: { "values": { "<ключ>": число } }.

Правила:
- Ключи в ответе — РОВНО те английские ключи, что перечислены в запросе. Все до одного.
- Число — в указанной для ключа единице, на 100 г продукта.
- Если нутриента в продукте практически нет или значение неизвестно — ставь 0.
- energy — в ккал на 100 г. Остальное — в своих единицах (г, мг, мкг).
- Это разумная оценка по типичным справочным значениям, не лабораторный анализ.
- Не добавляй комментариев, пояснений, markdown — только чистый JSON.`;

// The strict `{ <nutrientName>: number }` object — head C's top-level `values`
// and head A's per-item `nutrients` share it.
function nutrientValuesSchema(nutrients: NutrientSpec[]) {
  const properties: Record<string, { type: "number" }> = {};
  for (const n of nutrients) properties[n.name] = { type: "number" };
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: nutrients.map((n) => n.name),
  } as const;
}

function buildNutrientSchema(nutrients: NutrientSpec[]) {
  return {
    name: "product_nutrients",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        values: nutrientValuesSchema(nutrients),
      },
      required: ["values"],
    },
  };
}

// Shared sanity filter for LLM nutrient values (heads A and C). Keep only
// numbers for the keys we actually asked about — drop anything the model
// invented or returned non-numeric/non-positive. Plus a magnitude
// sanity-clamp: a 'g' nutrient can't exceed 100 g per 100 g of product, and
// energy can't realistically exceed ~900 kcal/100 g (pure fat) — drop absurd
// values (wrong unit / scale) rather than corrupt the product's profile.
function clampNutrientValues(
  rawValues: Record<string, unknown>,
  nutrients: NutrientSpec[],
): Record<string, number> {
  const unitByName = new Map(nutrients.map((n) => [n.name, n.unit]));
  const values: Record<string, number> = {};
  for (const [k, v] of Object.entries(rawValues)) {
    if (!unitByName.has(k)) continue;
    const num = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(num) || num <= 0) continue;
    const unit = unitByName.get(k);
    if (unit === "g" && num > 100) continue;
    if (unit === "kcal" && num > 1000) continue;
    values[k] = num;
  }
  return values;
}

interface NutrientLLMResult {
  values: Record<string, number>;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalCost?: number;
}

async function callNutrientLLM(
  productName: string,
  nutrients: NutrientSpec[],
  details?: string,
): Promise<NutrientLLMResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const model = getLLMModel();
  const nutrientLines = nutrients
    .map((n) => `${n.name} — ${n.unit} — ${n.label}`)
    .join("\n");
  const trimmedDetails = details?.trim();
  const userContent =
    `Продукт: "${productName}"\n` +
    (trimmedDetails ? `Особенность: ${trimmedDetails}\n` : "") +
    `Нутриенты (ключ — единица — название):\n${nutrientLines}`;

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
          { role: "system", content: NUTRIENT_SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        // temp 0.2: estimates should be stable + cache-friendly across retries.
        temperature: 0.2,
        // ~52 short numeric entries fit comfortably; cap guards against runaway.
        max_tokens: 2000,
        response_format: { type: "json_schema", json_schema: buildNutrientSchema(nutrients) },
        provider: { require_parameters: true },
      }),
    });
    if (response.status !== 429) break;
  }

  if (!response.ok) {
    // Raw upstream status/body stays in the server log only; the client sees a
    // stable ai_provider_error (502).
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
  const rawValues = (parsed?.values ?? {}) as Record<string, unknown>;
  const values = clampNutrientValues(rawValues, nutrients);

  const usage = (data as { usage?: { prompt_tokens?: number; completion_tokens?: number; total_cost?: number; cost?: number } }).usage;
  return {
    values,
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

// Shape only — every length cap below (dishName 200, comment 500, productName
// 200, nutrients 100) stays in its handler, which answers with the specific
// limit it enforced.
const DISH_PRODUCTS_BODY_SCHEMA = Type.Object(
  {
    dishName: Type.String(),
    comment: Type.Optional(Type.String()),
  },
  { additionalProperties: false, title: "SuggestDishProductsRequest" },
);

const PRODUCT_NUTRIENTS_BODY_SCHEMA = Type.Object(
  {
    productName: Type.String(),
    nutrients: Type.Array(
      Type.Object(
        {
          name: Type.String({ description: "Stable english key — the backend stays nutrient-agnostic." }),
          label: Type.String({ description: "RU display name, sent to the model as context." }),
          unit: Type.String(),
        },
        { additionalProperties: false, title: "NutrientSpec" },
      ),
    ),
    details: Type.Optional(
      Type.String({ description: "Prep method / peculiarity (e.g. \"вареная\"); empty string = absent." }),
    ),
  },
  { additionalProperties: false, title: "SuggestProductNutrientsRequest" },
);

export async function suggestionsRoutes(app: FastifyInstance) {
  app.post<{ Body: SuggestDishProductsRequest }>(
    "/dish-products",
    {
      schema: {
        operationId: "suggestDishProducts",
        tags: ["suggestions"],
        description:
          "Dish name → its typical ingredients as catalog-matched products. Paid.",
        security: [{ cookieSession: [] }],
        body: DISH_PRODUCTS_BODY_SCHEMA,
      },
    },
    async (req, reply) => {
      const { dishName, comment } = req.body ?? {};

      if (!dishName || typeof dishName !== "string" || !dishName.trim()) {
        return reply.status(400).send({ error: "dishName is required" });
      }

      if (dishName.length > 200) {
        return reply.status(400).send({ error: "dishName too long (max 200 chars)" });
      }

      if (comment !== undefined && typeof comment !== "string") {
        return reply.status(400).send({ error: "comment must be a string" });
      }
      if (typeof comment === "string" && comment.length > MAX_COMMENT_LEN) {
        return reply
          .status(400)
          .send({ error: `comment too long (max ${MAX_COMMENT_LEN} chars)` });
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
      const cacheKey = normalizeName(dishName, comment);
      let charged = false;

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
          // Paid step: debit before the OpenRouter call (cache hits are free).
          // req.userId comes from the requireUser onRequest hook added on the scope
          // in buildApp; absent only in the pure-pipeline unit tests.
          if (req.userId) {
            if (!(await chargeOr402(req, reply, "dish_suggestions", requestId))) return;
            charged = true;
          }
          const result = await callLLM(dishName, comment);
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
        // Refund a completed charge if the request failed before a usable result.
        if (charged && req.userId) {
          await refund(req.userId, "dish_suggestions", requestId).catch(() => {});
        }
        const message = err instanceof Error ? err.message : "Unknown error";
        app.log.error(`Suggestion error: ${message}`);
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Head C: product name → estimated full nutrient profile (per 100 g).
  app.post<{ Body: SuggestProductNutrientsRequest }>(
    "/product-nutrients",
    {
      schema: {
        operationId: "suggestProductNutrients",
        tags: ["suggestions"],
        description:
          "Product name → estimated nutrient values per 100 g of edible part. Correlational estimates, not lab data. Paid.",
        security: [{ cookieSession: [] }],
        body: PRODUCT_NUTRIENTS_BODY_SCHEMA,
      },
    },
    async (req, reply) => {
      const { productName, nutrients, details } = req.body ?? {};

      if (!productName || typeof productName !== "string" || !productName.trim()) {
        return reply.status(400).send({ error: "productName is required" });
      }
      if (productName.length > 200) {
        return reply.status(400).send({ error: "productName too long (max 200 chars)" });
      }
      if (!Array.isArray(nutrients) || nutrients.length === 0) {
        return reply.status(400).send({ error: "nutrients[] is required" });
      }
      if (nutrients.length > MAX_NUTRIENTS) {
        return reply.status(400).send({ error: `too many nutrients (max ${MAX_NUTRIENTS})` });
      }
      const valid = nutrients.every(
        (n) =>
          n &&
          typeof n.name === "string" &&
          n.name.trim() &&
          typeof n.label === "string" &&
          typeof n.unit === "string",
      );
      if (!valid) {
        return reply.status(400).send({ error: "each nutrient needs {name,label,unit}" });
      }
      if (details !== undefined && typeof details !== "string") {
        return reply.status(400).send({ error: "details must be a string" });
      }
      if (typeof details === "string" && details.length > MAX_DETAILS_LEN) {
        return reply
          .status(400)
          .send({ error: `details too long (max ${MAX_DETAILS_LEN} chars)` });
      }

      if (!checkRateLimit(`nut:${req.ip}`)) {
        return reply.status(429).send({
          error: `Rate limit exceeded. Max ${RATE_LIMIT} requests per hour.`,
        });
      }

      const requestId = resolveRequestId(req);
      const cacheKey = normalizeNutrientKey(productName, details);
      let charged = false;

      try {
        const cached = getCachedNutrients(cacheKey);
        let values: Record<string, number>;
        if (cached) {
          values = cached;
          app.log.info({ productName, requestId }, "suggestions/product-nutrients cache hit");
        } else {
          // Paid step: debit before the OpenRouter call (cache hits are free).
          if (req.userId) {
            if (!(await chargeOr402(req, reply, "nutrient_suggestions", requestId))) return;
            charged = true;
          }
          const result = await callNutrientLLM(productName, nutrients, details);
          values = result.values;
          setCachedNutrients(cacheKey, values);
          app.log.info(
            {
              productName,
              filled: Object.keys(values).length,
              requestId,
              latencyMs: result.latencyMs,
            },
            "suggestions/product-nutrients LLM inferred",
          );
          logLLMOutput({
            requestId,
            model: getLLMModel(),
            phrase: productName,
            itemsReturned: [],
            cached: false,
            latencyMs: result.latencyMs,
            ...(result.promptTokens !== undefined ? { promptTokens: result.promptTokens } : {}),
            ...(result.completionTokens !== undefined ? { completionTokens: result.completionTokens } : {}),
            ...(result.totalCost !== undefined ? { totalCost: result.totalCost } : {}),
          });
        }

        return reply.send({ values });
      } catch (err: unknown) {
        // Refund a completed charge if the request failed before a usable result.
        if (charged && req.userId) {
          await refund(req.userId, "nutrient_suggestions", requestId).catch(() => {});
        }
        const message = err instanceof Error ? err.message : "Unknown error";
        app.log.error(`Nutrient suggestion error: ${message}`);
        return reply.status(500).send({ error: message });
      }
    },
  );
}
