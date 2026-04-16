import { FastifyInstance } from "fastify";
import { loadCatalog, getCatalogIds } from "../catalog.js";

// ─── Types ───

interface SuggestDishProductsRequest {
  dishName: string;
  existingItems?: Array<{ productId: string; name: string; quantity: number }>;
}

interface SuggestionItem {
  productId: string;
  name: string;
  quantity: number;
}

// ─── Rate Limiting (in-memory) ───

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

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

// ─── Cache (in-memory, keyed by normalized dish name) ───

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_MAX = 200;

const cache = new Map<
  string,
  { result: SuggestionItem[]; expiresAt: number }
>();

function normalizeName(name: string): string {
  return name.toLowerCase().trim();
}

function getCached(key: string): SuggestionItem[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

function setCache(key: string, result: SuggestionItem[]): void {
  // Simple eviction: delete oldest when at max
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── LLM Call ───

const SYSTEM_PROMPT = `Ты — помощник по составлению блюд. Пользователь указал название блюда.
Предложи продукты из предоставленного каталога, которые обычно входят в это блюдо.

Правила:
1. Используй ТОЛЬКО продукты из каталога (по их ID)
2. Укажи количество в граммах (типичное для одной порции блюда)
3. Не дублируй продукты, которые уже есть в блюде
4. Верни JSON и НИЧЕГО кроме JSON: { "suggestions": [{ "productId": "...", "name": "...", "quantity": ... }] }
5. Предлагай 5-15 продуктов в зависимости от блюда`;

async function callLLM(
  dishName: string,
  existingItems: Array<{ productId: string; name: string; quantity: number }>,
  catalogJson: string
): Promise<SuggestionItem[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const model = process.env.SUGGESTION_MODEL ?? "deepseek/deepseek-chat";

  const existingText =
    existingItems.length > 0
      ? `\nУже добавлены (НЕ предлагай их): ${existingItems.map((i) => `${i.name} (${i.quantity}г)`).join(", ")}`
      : "";

  const userMessage = `Блюдо: "${dishName}"${existingText}\n\nКаталог продуктов:\n${catalogJson}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty LLM response");

  // Parse JSON from response (handle markdown code blocks if present)
  let jsonStr = content.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  const parsed = JSON.parse(jsonStr);
  const suggestions: SuggestionItem[] = parsed.suggestions ?? [];

  // Validate: only keep items with valid foodIds from catalog
  const existingIds = new Set(existingItems.map((i) => i.productId));
  const catalogIds = getCatalogIds();
  return suggestions.filter(
    (s) =>
      catalogIds.has(s.productId) &&
      !existingIds.has(s.productId) &&
      typeof s.quantity === "number" &&
      s.quantity > 0
  );
}

// ─── Routes ───

export async function suggestionsRoutes(app: FastifyInstance) {
  app.post<{ Body: SuggestDishProductsRequest }>(
    "/dish-products",
    async (req, reply) => {
      const { dishName, existingItems = [] } = req.body;

      if (!dishName || typeof dishName !== "string" || !dishName.trim()) {
        return reply.status(400).send({ error: "dishName is required" });
      }

      // Rate limit by IP
      const clientKey = req.ip;
      if (!checkRateLimit(clientKey)) {
        return reply.status(429).send({
          error: "Rate limit exceeded. Max 10 requests per hour.",
        });
      }

      // Check cache (ignoring existingItems for cache key — same dish name gives same base suggestions)
      const cacheKey = normalizeName(dishName);
      const cached = getCached(cacheKey);
      if (cached) {
        // Filter out existing items from cached result
        const existingIds = new Set(existingItems.map((i) => i.productId));
        const filtered = cached.filter((s) => !existingIds.has(s.productId));
        return { suggestions: filtered, cached: true };
      }

      try {
        const catalogData = loadCatalog();
        const catalogJson = JSON.stringify(catalogData);

        const suggestions = await callLLM(dishName, existingItems, catalogJson);

        // Cache the full result (before filtering existing)
        setCache(cacheKey, suggestions);

        return { suggestions };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        app.log.error(`Suggestion error: ${message}`);
        return reply.status(500).send({ error: message });
      }
    }
  );
}
