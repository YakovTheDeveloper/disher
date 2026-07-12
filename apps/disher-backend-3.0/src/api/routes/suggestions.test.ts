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

// Billing mocks — override chargeOr402/refund so the route's paid path is
// testable without a DB. `resolveRequestId` stays real (importOriginal) so the
// dish caching test still gets a fresh requestId per call.
const { chargeOr402Mock, refundMock } = vi.hoisted(() => ({
  chargeOr402Mock: vi.fn(),
  refundMock: vi.fn(),
}));
vi.mock("../../billing/http.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../billing/http.js")>();
  return { ...actual, chargeOr402: (...a: unknown[]) => chargeOr402Mock(...a) };
});
vi.mock("../../billing/wallet.js", () => ({
  refund: (...a: unknown[]) => refundMock(...a),
  charge: vi.fn(),
}));

const matcher = (await import("../food-matcher.js")) as unknown as {
  __state: {
    ready: boolean;
    aliases: Map<string, { id: string; name: string; score: number }>;
    matches: Map<string, Array<{ id: string; name: string; score: number }>>;
  };
};
const { suggestionsRoutes } = await import("./suggestions.js");

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
  chargeOr402Mock.mockReset();
  chargeOr402Mock.mockResolvedValue(true);
  refundMock.mockReset();
  refundMock.mockResolvedValue(undefined);
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

describe("POST /api/suggestions/dish-products — clarification comment", () => {
  it("passes the comment to the LLM user message", async () => {
    setAlias("тофу", { id: "p-tofu", name: "Тофу" });
    const fetchMock = mockLLM([{ name: "тофу", quantity: 100 }]);

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url,
      payload: { dishName: "плов", comment: "вегетарианский, без мяса" },
    });

    expect(res.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // mockLLM's fn is argless → mock.calls is typed as empty tuples; cast to the
    // real fetch(url, init) shape to read the request body we care about.
    const calls = fetchMock.mock.calls as unknown as Array<[string, { body: string }]>;
    const sentBody = JSON.parse(calls[0][1].body);
    const userMsg = sentBody.messages.find(
      (m: { role: string }) => m.role === "user",
    );
    expect(userMsg.content).toContain("вегетарианский, без мяса");
    expect(userMsg.content).toContain("плов");
  });

  it("segments the cache by comment (same dish, different comment → second LLM call)", async () => {
    setAlias("рис", { id: "p-rice", name: "Рис" });
    const fetchMock = mockLLM([{ name: "рис", quantity: 150 }]);

    const app = await buildApp();
    // No comment, then a comment, then the same comment again.
    await app.inject({ method: "POST", url, payload: { dishName: "плов кэш-тест" } });
    await app.inject({
      method: "POST",
      url,
      payload: { dishName: "плов кэш-тест", comment: "острый" },
    });
    await app.inject({
      method: "POST",
      url,
      payload: { dishName: "плов кэш-тест", comment: "острый" },
    });

    // 1st (no comment) + 2nd (new comment) miss; 3rd (repeat comment) is a hit.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("400 when comment exceeds the max length", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url,
      payload: { dishName: "борщ", comment: "я".repeat(501) },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/comment too long/);
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

// ─── Head C: product-nutrients ───

const nutUrl = "/api/suggestions/product-nutrients";

// LLM mock returning a nutrient `{ values }` payload (mirrors mockLLM's shape).
function mockNutrientLLM(values: Record<string, number>) {
  const fetchMock = vi.fn(async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ values }) } }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const SPEC = [
  { name: "protein", label: "Белки", unit: "g" },
  { name: "fats", label: "Жиры", unit: "g" },
];

describe("POST /api/suggestions/product-nutrients — validation", () => {
  it("400 on missing productName", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url: nutUrl, payload: { nutrients: SPEC } });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/productName is required/);
  });

  it("400 on empty nutrients[]", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: nutUrl,
      payload: { productName: "творог", nutrients: [] },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/nutrients/);
  });

  it("400 when a nutrient is missing name/label/unit", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: nutUrl,
      payload: { productName: "творог", nutrients: [{ name: "protein" }] },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/suggestions/product-nutrients — pipeline", () => {
  it("returns { values } keyed by the requested names, per 100 g", async () => {
    mockNutrientLLM({ protein: 16.5, fats: 9 });
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: nutUrl,
      payload: { productName: "творог 5%", nutrients: SPEC },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ values: { protein: 16.5, fats: 9 } });
  });

  it("drops keys not requested and non-positive values", async () => {
    // bogus → not in the requested spec; fats:0 and zinc:-1 → non-positive.
    mockNutrientLLM({ protein: 12, fats: 0, bogus: 9, zinc: -1 });
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: nutUrl,
      payload: { productName: "белок-only продукт", nutrients: SPEC },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ values: { protein: 12 } });
  });

  it("caches by normalized product name (case-insensitive, trimmed)", async () => {
    const fetchMock = mockNutrientLLM({ protein: 20, fats: 1 });
    const app = await buildApp();
    const r1 = await app.inject({
      method: "POST",
      url: nutUrl,
      payload: { productName: "Куриная грудка", nutrients: SPEC },
    });
    const r2 = await app.inject({
      method: "POST",
      url: nutUrl,
      payload: { productName: "  куриная грудка  ", nutrients: SPEC },
    });
    expect(r1.statusCode).toBe(200);
    expect(r2.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(r1.json()).toEqual(r2.json());
  });
});

describe("POST /api/suggestions/product-nutrients — errors", () => {
  it("500 when OPENROUTER_API_KEY is missing", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: nutUrl,
      payload: { productName: "no-key unique product", nutrients: SPEC },
    });
    expect(res.statusCode).toBe(500);
    expect(res.json().error).toMatch(/OPENROUTER_API_KEY/);
  });
});

describe("POST /api/suggestions/product-nutrients — sanity clamp", () => {
  it("drops 'g' nutrients over 100 g and energy over 1000 kcal", async () => {
    mockNutrientLLM({ protein: 150, fats: 12, energy: 5000 });
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: nutUrl,
      payload: {
        productName: "clamp product",
        nutrients: [
          { name: "protein", label: "Белки", unit: "g" },
          { name: "fats", label: "Жиры", unit: "g" },
          { name: "energy", label: "Энергия", unit: "kcal" },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    // protein 150g (>100) and energy 5000 (>1000) dropped; fats kept.
    expect(res.json()).toEqual({ values: { fats: 12 } });
  });
});

describe("POST /api/suggestions/product-nutrients — billing", () => {
  async function buildAppWithUser(userId = "u1"): Promise<FastifyInstance> {
    const app = Fastify();
    app.addHook("preHandler", async (req) => {
      (req as unknown as { userId: string }).userId = userId;
    });
    await app.register(suggestionsRoutes, { prefix: "/api/suggestions" });
    await app.ready();
    return app;
  }

  it("charges nutrient_suggestions before the LLM call", async () => {
    mockNutrientLLM({ protein: 16, fats: 9 });
    const app = await buildAppWithUser();
    const res = await app.inject({
      method: "POST",
      url: nutUrl,
      payload: { productName: "billing charge product", nutrients: SPEC },
    });
    expect(res.statusCode).toBe(200);
    expect(chargeOr402Mock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "nutrient_suggestions",
      expect.any(String),
    );
  });

  it("stops before the LLM when the wallet can't cover it (402)", async () => {
    chargeOr402Mock.mockImplementation(
      async (
        _req: unknown,
        reply: { status: (n: number) => { send: (b: unknown) => void } },
      ) => {
        reply.status(402).send({ error: "insufficient_balance", needKop: 50, haveKop: 0 });
        return false;
      },
    );
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const app = await buildAppWithUser();
    const res = await app.inject({
      method: "POST",
      url: nutUrl,
      payload: { productName: "billing 402 product", nutrients: SPEC },
    });
    expect(res.statusCode).toBe(402);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refunds when the LLM call fails after charging", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 502 })));
    const app = await buildAppWithUser();
    const res = await app.inject({
      method: "POST",
      url: nutUrl,
      payload: { productName: "billing refund product", nutrients: SPEC },
    });
    expect(res.statusCode).toBe(500);
    expect(refundMock).toHaveBeenCalledWith(
      "u1",
      "nutrient_suggestions",
      expect.any(String),
    );
  });
});
