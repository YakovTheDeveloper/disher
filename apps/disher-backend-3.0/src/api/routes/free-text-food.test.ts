import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";

// ── Mock food-matcher so the route sees a deterministic catalog ──
// Tests control `ready`, `aliases`, and `matches` through exported setters.

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

// Import after mock so the route picks up the mocked module.
const matcher = (await import("../food-matcher.js")) as unknown as {
  __state: {
    ready: boolean;
    aliases: Map<string, { id: string; name: string; score: number }>;
    matches: Map<string, Array<{ id: string; name: string; score: number }>>;
  };
};
const { freeTextFoodRoutes } = await import("./free-text-food.js");

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

function mockLLM(items: Array<{ name: string; quantity?: number | null; time?: string | null }>) {
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
                  quantity: i.quantity ?? null,
                  time: i.time ?? null,
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
  await app.register(freeTextFoodRoutes, { prefix: "/api/free-text-food" });
  await app.ready();
  return app;
}

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

describe("POST /api/free-text-food/parse — validation", () => {
  it("400 on empty body", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url: "/api/free-text-food/parse", payload: {} });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: /text is required/ });
  });

  it("400 on whitespace-only text", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "   " },
    });
    expect(res.statusCode).toBe(400);
  });

  it("400 on text longer than 2000 chars", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "a".repeat(2001) },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/too long/);
  });

  it("503 when matcher is not ready", async () => {
    matcher.__state.ready = false;
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "овсянка" },
    });
    expect(res.statusCode).toBe(503);
  });
});

describe("POST /api/free-text-food/parse — pipeline", () => {
  it("resolves via alias without calling matchOne", async () => {
    setAlias("картошка", { id: "p-potato", name: "Картофель", score: 1 });
    mockLLM([{ name: "картошка", quantity: 200, time: "13:00" }]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "картошка 200г в обед" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.resolved).toHaveLength(1);
    expect(body.resolved[0]).toMatchObject({
      productId: "p-potato",
      name: "Картофель",
      originalName: "картошка",
      quantity: 200,
      time: "13:00",
      confidence: 1,
    });
    expect(body.resolved[0].quantityGuessed).toBeUndefined();
    expect(body.ambiguous).toHaveLength(0);
    expect(body.unresolved).toHaveLength(0);
  });

  it("resolves item when top1 clears both threshold and margin", async () => {
    setMatches("овсянка", [
      { id: "p-oats", name: "Овсяные хлопья", score: 0.9 },
      { id: "p-buck", name: "Гречка", score: 0.7 },
    ]);
    mockLLM([{ name: "овсянка", quantity: 150, time: "08:00" }]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "овсянка 150г" },
    });

    const body = res.json();
    expect(body.resolved).toHaveLength(1);
    expect(body.resolved[0].productId).toBe("p-oats");
    expect(body.ambiguous).toHaveLength(0);
  });

  it("falls to ambiguous when margin is too thin (top2 close to top1)", async () => {
    setMatches("борщ", [
      { id: "p-a", name: "Суп овощной", score: 0.9 },
      { id: "p-b", name: "Суп куриный", score: 0.895 }, // margin 0.005 < 0.015
      { id: "p-c", name: "Бульон", score: 0.85 },
    ]);
    mockLLM([{ name: "борщ", quantity: 250, time: "13:00" }]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "борщ" },
    });

    const body = res.json();
    expect(body.resolved).toHaveLength(0);
    expect(body.ambiguous).toHaveLength(1);
    expect(body.ambiguous[0]).toMatchObject({
      originalName: "борщ",
      quantity: 250,
      time: "13:00",
    });
    expect(body.ambiguous[0].candidates).toHaveLength(3);
  });

  it("falls to ambiguous when top1 above floor but margin too thin", async () => {
    setMatches("запеканка", [
      { id: "p-a", name: "Творожная масса", score: 0.83 },
      { id: "p-b", name: "Сырники", score: 0.82 }, // margin 0.01 < 0.02
    ]);
    mockLLM([{ name: "запеканка", quantity: 150 }]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "запеканка" },
    });

    const body = res.json();
    expect(body.resolved).toHaveLength(0);
    expect(body.ambiguous).toHaveLength(1);
  });

  it("resolves low-absolute-score matches when margin is decisive", async () => {
    // Reflects real e5-small behavior: сметана scored 0.853 in probe but was
    // the correct top-1 with a clear gap from top-2.
    setMatches("сметана", [
      { id: "p-sour", name: "Сметана", score: 0.853 },
      { id: "p-cream", name: "Сливки", score: 0.82 }, // margin 0.033
    ]);
    mockLLM([{ name: "сметана", quantity: 50 }]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "сметана margin-first phrase" },
    });

    const body = res.json();
    expect(body.resolved).toHaveLength(1);
    expect(body.resolved[0].productId).toBe("p-sour");
  });

  it("falls to unresolved when score is below ambiguous floor", async () => {
    setMatches("пельмени", [{ id: "p-x", name: "Вареники", score: 0.6 }]);
    mockLLM([{ name: "пельмени", quantity: 300 }]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "пельмени" },
    });

    const body = res.json();
    expect(body.unresolved).toHaveLength(1);
    expect(body.unresolved[0].originalName).toBe("пельмени");
  });

  it("falls to unresolved when matchOne returns no candidates", async () => {
    setMatches("неведомое", []);
    mockLLM([{ name: "неведомое", quantity: 50 }]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "неведомое" },
    });

    expect(res.json().unresolved).toHaveLength(1);
  });

  it("applies quantity fallback and flags quantityGuessed when LLM returns 0", async () => {
    setAlias("банан", { id: "p-banana", name: "Банан" });
    mockLLM([{ name: "банан", quantity: 0, time: "08:00" }]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "банан" },
    });

    const body = res.json();
    expect(body.resolved[0].quantity).toBe(100);
    expect(body.resolved[0].quantityGuessed).toBe(true);
  });

  it("applies quantity fallback when LLM returns null", async () => {
    setAlias("яблоко", { id: "p-apple", name: "Яблоко" });
    mockLLM([{ name: "яблоко", quantity: null, time: null }]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "яблоко" },
    });

    expect(res.json().resolved[0].quantity).toBe(100);
    expect(res.json().resolved[0].quantityGuessed).toBe(true);
  });

  it("rounds fractional quantities and does NOT flag quantityGuessed", async () => {
    setAlias("молоко", { id: "p-milk", name: "Молоко" });
    mockLLM([{ name: "молоко", quantity: 123.4, time: "08:00" }]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "молоко" },
    });

    expect(res.json().resolved[0].quantity).toBe(123);
    expect(res.json().resolved[0].quantityGuessed).toBeUndefined();
  });

  it("fills default times [08:00, 13:00, 16:00] when LLM returns all null", async () => {
    setAlias("a", { id: "id-a", name: "A" });
    setAlias("b", { id: "id-b", name: "B" });
    setAlias("c", { id: "id-c", name: "C" });
    mockLLM([
      { name: "a", quantity: 100 },
      { name: "b", quantity: 100 },
      { name: "c", quantity: 100 },
    ]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "time-defaults-all-null phrase" },
    });

    const times = res.json().resolved.map((r: { time: string }) => r.time);
    expect(times).toEqual(["08:00", "13:00", "16:00"]);
  });

  it("advances slot cursor past defaults ≤ explicit time", async () => {
    setAlias("a", { id: "id-a", name: "A" });
    setAlias("b", { id: "id-b", name: "B" });
    setAlias("c", { id: "id-c", name: "C" });
    mockLLM([
      { name: "a", quantity: 100, time: "10:00" },
      { name: "b", quantity: 100, time: null },
      { name: "c", quantity: 100, time: null },
    ]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "time-cursor-advance phrase" },
    });

    const times = res.json().resolved.map((r: { time: string }) => r.time);
    expect(times).toEqual(["10:00", "13:00", "16:00"]);
  });

  it("clamps time cursor to the last slot when items outnumber defaults", async () => {
    setAlias("a", { id: "id-a", name: "A" });
    setAlias("b", { id: "id-b", name: "B" });
    setAlias("c", { id: "id-c", name: "C" });
    setAlias("d", { id: "id-d", name: "D" });
    setAlias("e", { id: "id-e", name: "E" });
    mockLLM([
      { name: "a", quantity: 100 },
      { name: "b", quantity: 100 },
      { name: "c", quantity: 100 },
      { name: "d", quantity: 100 },
      { name: "e", quantity: 100 },
    ]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "time-cursor-clamp phrase" },
    });

    const times = res.json().resolved.map((r: { time: string }) => r.time);
    expect(times).toEqual(["08:00", "13:00", "16:00", "19:00", "19:00"]);
  });

  it("handles mixed resolved / ambiguous / unresolved in one request", async () => {
    setAlias("овсянка", { id: "p-oats", name: "Овсяные хлопья" });
    setMatches("борщ", [
      { id: "p-a", name: "Суп овощной", score: 0.9 },
      { id: "p-b", name: "Суп куриный", score: 0.895 },
    ]);
    setMatches("нечтостранное", [{ id: "p-z", name: "Что-то", score: 0.5 }]);
    mockLLM([
      { name: "овсянка", quantity: 150, time: "08:00" },
      { name: "борщ", quantity: 250, time: "13:00" },
      { name: "нечтостранное", quantity: 50, time: "19:00" },
    ]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "all three" },
    });

    const body = res.json();
    expect(body.resolved).toHaveLength(1);
    expect(body.ambiguous).toHaveLength(1);
    expect(body.unresolved).toHaveLength(1);
  });

  it("returns empty result when LLM returns no items", async () => {
    mockLLM([]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "абвгд" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({ resolved: [], ambiguous: [], unresolved: [] });
    expect(typeof body.requestId).toBe("string");
  });
});

describe("POST /api/free-text-food/parse — caching", () => {
  it("serves cached LLM response on repeated identical text (case-insensitive, trimmed)", async () => {
    setAlias("банан", { id: "p-banana", name: "Банан" });
    const fetchMock = mockLLM([{ name: "банан", quantity: 120, time: "08:00" }]);

    const app = await buildApp();
    const payload1 = { text: "Съел банан" };
    const payload2 = { text: "  съел банан  " };

    const r1 = await app.inject({ method: "POST", url: "/api/free-text-food/parse", payload: payload1 });
    const r2 = await app.inject({ method: "POST", url: "/api/free-text-food/parse", payload: payload2 });

    expect(r1.statusCode).toBe(200);
    expect(r2.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(r1.json()).toEqual(r2.json());
  });
});

describe("POST /api/free-text-food/parse — errors", () => {
  it("500 when OPENROUTER_API_KEY is missing", async () => {
    delete process.env.OPENROUTER_API_KEY;
    setAlias("банан", { id: "p-banana", name: "Банан" });

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      // Unique text so we skip the cache from other tests.
      payload: { text: "no-key unique banana phrase" },
    });

    expect(res.statusCode).toBe(500);
    expect(res.json().error).toMatch(/OPENROUTER_API_KEY/);
  });

  it("500 when OpenRouter returns a non-2xx status", async () => {
    const fetchMock = vi.fn(
      async () => new Response("boom", { status: 502 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "unique upstream failure phrase" },
    });

    expect(res.statusCode).toBe(500);
    expect(res.json().error).toMatch(/OpenRouter error 502/);
  });

  it("500 when LLM returns invalid JSON", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "not json at all" } }],
          }),
          { status: 200 }
        )
    );
    vi.stubGlobal("fetch", fetchMock);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "unique invalid json phrase" },
    });

    expect(res.statusCode).toBe(500);
  });

  it("strips ```json fences from LLM response", async () => {
    setAlias("банан", { id: "p-banana", name: "Банан" });
    const fenced = "```json\n" +
      JSON.stringify({ items: [{ type: "product", name: "банан", quantity: 120, time: "08:00" }] }) +
      "\n```";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ choices: [{ message: { content: fenced } }] }),
            { status: 200 }
          )
      )
    );

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/free-text-food/parse",
      payload: { text: "unique fenced phrase" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().resolved).toHaveLength(1);
  });
});
