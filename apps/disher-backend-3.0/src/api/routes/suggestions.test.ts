import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";

// ── Mock food-matcher so the route (via shared resolveNames) sees a
// deterministic catalog. Same pattern as free-text-food.test.ts. The mock
// intercepts food-matcher.js for resolve-names.ts too (module-wide). ──

vi.mock("../food-matcher.js", () => {
  const state = {
    ready: true,
    aliases: new Map<string, { id: string; name: string; score: number }>(),
    matches: new Map<string, Array<{ id: string; name: string; score: number }>>(),
  };
  return {
    __state: state,
    isMatcherReady: () => state.ready,
    lookupAlias: (text: string) => state.aliases.get(text.toLowerCase().trim()) ?? null,
    matchOne: async (text: string) => state.matches.get(text.toLowerCase().trim()) ?? [],
    normalizeForEmbedding: (text: string) =>
      text.toLowerCase().replace(/ё/g, "е").trim(),
  };
});

const matcher = (await import("../food-matcher.js")) as unknown as {
  __state: {
    ready: boolean;
    aliases: Map<string, { id: string; name: string; score: number }>;
    matches: Map<string, Array<{ id: string; name: string; score: number }>>;
  };
};
const { suggestionsRoutes } = await import("./suggestions.js");

// ── Helpers ──

function setAlias(key: string, value: { id: string; name: string; score?: number }) {
  matcher.__state.aliases.set(key.toLowerCase().trim(), {
    id: value.id,
    name: value.name,
    score: value.score ?? 1,
  });
}

function setMatches(
  key: string,
  candidates: Array<{ id: string; name: string; score: number }>
) {
  matcher.__state.matches.set(key.toLowerCase().trim(), candidates);
}

// Head A returns the same item shape as head B (name + quantity + details/time).
function mockLLM(
  items: Array<{ name: string; quantity?: number | null; details?: string }>
) {
  const fetchMock = vi.fn(async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                items: items.map((i) => ({
                  type: "product",
                  name: i.name,
                  details: i.details ?? "",
                  quantity: i.quantity ?? null,
                  time: null,
                })),
              }),
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify();
  await app.register(suggestionsRoutes, { prefix: "/api/suggestions" });
  await app.ready();
  return app;
}

const url = "/api/suggestions/dish-products";

beforeEach(() => {
  matcher.__state.ready = true;
  matcher.__state.aliases.clear();
  matcher.__state.matches.clear();
  process.env.OPENROUTER_API_KEY = "test-key";
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/suggestions/dish-products — validation", () => {
  it("400 on empty body", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, payload: {} });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: /dishName is required/ });
  });

  it("400 on whitespace-only dishName", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, payload: { dishName: "   " } });
    expect(res.statusCode).toBe(400);
  });

  it("400 on dishName longer than 200 chars", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, payload: { dishName: "а".repeat(201) } });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/too long/);
  });

  it("503 when matcher is not ready", async () => {
    matcher.__state.ready = false;
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, payload: { dishName: "борщ" } });
    expect(res.statusCode).toBe(503);
  });
});

describe("POST /api/suggestions/dish-products — pipeline", () => {
  it("returns a ParseResponse (resolved/ambiguous/unresolved), NOT a flat suggestions[]", async () => {
    setAlias("свекла", { id: "p-beet", name: "Свекла" });
    setAlias("капуста", { id: "p-cabbage", name: "Капуста" });
    mockLLM([
      { name: "свекла", quantity: 80, details: "вареная" },
      { name: "капуста", quantity: 100 },
    ]);

    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, payload: { dishName: "борщ" } });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("requestId");
    expect(body).toHaveProperty("resolved");
    expect(body).toHaveProperty("ambiguous");
    expect(body).toHaveProperty("unresolved");
    expect(body).not.toHaveProperty("suggestions");
    expect(body.resolved).toHaveLength(2);
    expect(body.resolved[0]).toMatchObject({
      productId: "p-beet",
      name: "Свекла",
      originalName: "свекла",
      quantity: 80,
      details: "вареная",
    });
  });

  it("buckets resolved / ambiguous / unresolved by matcher score", async () => {
    setAlias("картофель", { id: "p-potato", name: "Картофель" });
    setMatches("морковь", [
      { id: "p-carrot", name: "Морковь", score: 0.9 },
      { id: "p-carrot2", name: "Морковь молодая", score: 0.899 }, // margin 0.001 → ambiguous
    ]);
    setMatches("экзотика", [{ id: "p-x", name: "Нечто", score: 0.5 }]); // below floor → unresolved
    mockLLM([
      { name: "картофель", quantity: 100 },
      { name: "морковь", quantity: 50 },
      { name: "экзотика", quantity: 20 },
    ]);

    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, payload: { dishName: "рагу" } });

    const body = res.json();
    expect(body.resolved).toHaveLength(1);
    expect(body.ambiguous).toHaveLength(1);
    expect(body.unresolved).toHaveLength(1);
    expect(body.unresolved[0].originalName).toBe("экзотика");
  });

  it("returns empty result when LLM returns no items", async () => {
    mockLLM([]);
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, payload: { dishName: "пустота" } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({ resolved: [], ambiguous: [], unresolved: [] });
    expect(typeof body.requestId).toBe("string");
  });

  it("applies quantity fallback when LLM omits grams", async () => {
    setAlias("яйцо", { id: "p-egg", name: "Яйцо" });
    mockLLM([{ name: "яйцо", quantity: null }]);
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, payload: { dishName: "омлет" } });
    expect(res.json().resolved[0].quantity).toBe(100);
  });
});

describe("POST /api/suggestions/dish-products — caching", () => {
  it("serves cached LLM recipe on repeated dish name (case-insensitive, trimmed)", async () => {
    setAlias("рис", { id: "p-rice", name: "Рис" });
    const fetchMock = mockLLM([{ name: "рис", quantity: 150 }]);

    const app = await buildApp();
    const r1 = await app.inject({ method: "POST", url, payload: { dishName: "Плов" } });
    const r2 = await app.inject({ method: "POST", url, payload: { dishName: "  плов  " } });

    expect(r1.statusCode).toBe(200);
    expect(r2.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // requestId is fresh per request; only the head-A items are cached.
    const { requestId: id1, ...rest1 } = r1.json();
    const { requestId: id2, ...rest2 } = r2.json();
    expect(rest1).toEqual(rest2);
    expect(id1).not.toBe(id2);
  });
});

describe("POST /api/suggestions/dish-products — errors", () => {
  it("500 when OPENROUTER_API_KEY is missing", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, payload: { dishName: "no-key unique dish" } });
    expect(res.statusCode).toBe(500);
    expect(res.json().error).toMatch(/OPENROUTER_API_KEY/);
  });

  it("500 when OpenRouter returns a non-2xx status", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 502 })));
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, payload: { dishName: "unique upstream fail dish" } });
    expect(res.statusCode).toBe(500);
    expect(res.json().error).toMatch(/OpenRouter error 502/);
  });

  it("strips ```json fences from the LLM response", async () => {
    setAlias("сыр", { id: "p-cheese", name: "Сыр" });
    const fenced = "```json\n" +
      JSON.stringify({ items: [{ type: "product", name: "сыр", quantity: 40, time: null }] }) +
      "\n```";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: fenced } }] }), { status: 200 }))
    );

    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, payload: { dishName: "unique fenced dish" } });
    expect(res.statusCode).toBe(200);
    expect(res.json().resolved).toHaveLength(1);
  });
});
