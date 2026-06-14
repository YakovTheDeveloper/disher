import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestUser, type TestUser } from "../../test/auth-helpers.js";
import { makeTestPool, truncateAllUserData } from "../../test/db-helpers.js";
import { requireUser } from "../../auth/require-user.js";
import { PRICES_KOP, WELCOME_GRANT_KOP } from "../prices.js";

// Billing wiring across the five paid endpoints: debit-on-real-call,
// free-on-cache-hit, 402-when-broke, refund-on-failure. The pure pipeline /
// prompt / SSE behaviours are covered by each route's own test; here we only
// assert the wallet side-effects. Skips without TEST_DATABASE_URL.
//
// food-matcher is mocked so the JSON routes' resolveNames is deterministic and
// offline; the OpenRouter call is a stubbed global fetch (JSON routes) or an
// injected stub (analyze / analyze-dish / analyze-daily).

vi.mock("../../api/food-matcher.js", () => {
  const state = {
    ready: true,
    aliases: new Map<string, { id: string; name: string; score: number }>([
      ["банан", { id: "p-banana", name: "Банан", score: 1 }],
    ]),
  };
  return {
    __state: state,
    isMatcherReady: () => state.ready,
    lookupAlias: (text: string) => state.aliases.get(text.toLowerCase().trim()) ?? null,
    matchOne: async () => [],
    normalizeForEmbedding: (text: string) =>
      text.toLowerCase().replace(/ё/g, "е").trim(),
  };
});

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

let pool: ReturnType<typeof makeTestPool>;
let getBalance: typeof import("../wallet.js").getBalance;

// LLM stub for the JSON routes — one item that resolves via the mocked alias.
function stubFetchOk() {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    items: [{ type: "product", name: "банан", quantity: 120, time: "08:00" }],
                  }),
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    ),
  );
}

function stubFetch502() {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 502 })));
}

async function setBalance(userId: string, kop: number): Promise<void> {
  await pool.query(`update wallet set balance_kop = $2 where user_id = $1`, [userId, kop]);
}

// Create the wallet (welcome grant) then empty it — so the next charge 402s.
async function drain(userId: string): Promise<void> {
  await getBalance(userId);
  await setBalance(userId, 0);
}

// Refunds on SSE / background-job routes land AFTER the response ends (the
// handler awaits refund post-stream; in production Fastify awaits the handler,
// but inject() resolves on response end). Poll until the balance settles.
async function waitForBalance(userId: string, expectedKop: number): Promise<number> {
  for (let i = 0; i < 100; i++) {
    const b = await getBalance(userId);
    if (b === expectedKop) return b;
    await new Promise((r) => setTimeout(r, 20));
  }
  return getBalance(userId);
}

beforeAll(async () => {
  if (!ready) return;
  ({ getBalance } = await import("../wallet.js"));
  pool = makeTestPool();
});

afterAll(async () => {
  if (!ready) return;
  await pool?.end();
});

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = "test-key";
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─── JSON routes: free-text-food + suggestions ───
//
// Registered exactly like buildApp — requireUser on a scope, route inside.

async function buildJsonApp(
  routes: (app: FastifyInstance) => Promise<void>,
  prefix: string,
): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(
    async (scope) => {
      scope.addHook("preHandler", requireUser);
      await scope.register(routes);
    },
    { prefix },
  );
  await app.ready();
  return app;
}

describeIfReady("POST /api/free-text-food/parse — billing", () => {
  let app: FastifyInstance;
  let user: TestUser;

  beforeAll(async () => {
    if (!ready) return;
    const { freeTextFoodRoutes } = await import("../../api/routes/free-text-food.js");
    app = await buildJsonApp(freeTextFoodRoutes, "/api/free-text-food");
  });
  afterAll(async () => {
    if (!ready) return;
    await app?.close();
  });
  beforeEach(async () => {
    await truncateAllUserData(pool);
    user = await createTestUser();
    stubFetchOk();
  });

  const url = "/api/free-text-food/parse";

  it("401 without a bearer", async () => {
    const res = await app.inject({ method: "POST", url, payload: { text: "банан unauth" } });
    expect(res.statusCode).toBe(401);
  });

  it("debits the price on a real LLM call, free on cache hit", async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    const r1 = await app.inject({
      method: "POST",
      url,
      headers: user.headers,
      payload: { text: "уникальный банан раз" },
    });
    expect(r1.statusCode).toBe(200);
    expect(await getBalance(user.userId)).toBe(WELCOME_GRANT_KOP - PRICES_KOP.free_text_parse);

    // Same text → cache hit → no upstream call, no second debit.
    const r2 = await app.inject({
      method: "POST",
      url,
      headers: user.headers,
      payload: { text: "уникальный банан раз" },
    });
    expect(r2.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await getBalance(user.userId)).toBe(WELCOME_GRANT_KOP - PRICES_KOP.free_text_parse);
  });

  it("402 with need/have when the balance can't cover the price, and skips the LLM", async () => {
    await drain(user.userId);
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    const res = await app.inject({
      method: "POST",
      url,
      headers: user.headers,
      payload: { text: "broke banana" },
    });
    expect(res.statusCode).toBe(402);
    expect(res.json()).toMatchObject({
      error: "insufficient_balance",
      needKop: PRICES_KOP.free_text_parse,
      haveKop: 0,
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await getBalance(user.userId)).toBe(0);
  });

  it("refunds the charge when the LLM call fails", async () => {
    stubFetch502();
    const res = await app.inject({
      method: "POST",
      url,
      headers: user.headers,
      payload: { text: "upstream fail banana" },
    });
    expect(res.statusCode).toBe(500);
    // charged then refunded → balance back to the welcome grant.
    expect(await getBalance(user.userId)).toBe(WELCOME_GRANT_KOP);
  });
});

describeIfReady("POST /api/suggestions/dish-products — billing", () => {
  let app: FastifyInstance;
  let user: TestUser;

  beforeAll(async () => {
    if (!ready) return;
    const { suggestionsRoutes } = await import("../../api/routes/suggestions.js");
    app = await buildJsonApp(suggestionsRoutes, "/api/suggestions");
  });
  afterAll(async () => {
    if (!ready) return;
    await app?.close();
  });
  beforeEach(async () => {
    await truncateAllUserData(pool);
    user = await createTestUser();
    stubFetchOk();
  });

  const url = "/api/suggestions/dish-products";

  it("debits dish_suggestions on a real call", async () => {
    const res = await app.inject({
      method: "POST",
      url,
      headers: user.headers,
      payload: { dishName: "уникальное блюдо" },
    });
    expect(res.statusCode).toBe(200);
    expect(await getBalance(user.userId)).toBe(WELCOME_GRANT_KOP - PRICES_KOP.dish_suggestions);
  });

  it("402 when broke", async () => {
    await drain(user.userId);
    const res = await app.inject({
      method: "POST",
      url,
      headers: user.headers,
      payload: { dishName: "broke dish" },
    });
    expect(res.statusCode).toBe(402);
    expect(await getBalance(user.userId)).toBe(0);
  });
});

// ─── analyze-dish (single JSON, injected stub) ───

describeIfReady("POST /api/analyze-dish — billing", () => {
  let app: FastifyInstance;
  let user: TestUser;
  let mode: "ok" | "fail" = "ok";

  const okResponse = JSON.stringify({
    summary: "разбор блюда",
    insights: [],
    hypotheses: [],
  });

  beforeAll(async () => {
    if (!ready) return;
    const { analyzeDishRoutes } = await import("../../api/routes/analyze-dish.js");
    app = Fastify({ logger: false });
    await app.register(
      async (instance) => {
        await analyzeDishRoutes(instance, {
          callLLM: async () => {
            if (mode === "fail") throw new Error("upstream down");
            return okResponse;
          },
        });
      },
      { prefix: "/api" },
    );
    await app.ready();
  });
  afterAll(async () => {
    if (!ready) return;
    await app?.close();
  });
  beforeEach(async () => {
    await truncateAllUserData(pool);
    user = await createTestUser();
    mode = "ok";
  });

  const url = "/api/analyze-dish";
  const body = { dishName: "Борщ", ingredients: [{ name: "свёкла", grams: 300 }] };

  it("debits dish_analysis on a successful analysis", async () => {
    const res = await app.inject({ method: "POST", url, headers: user.headers, payload: body });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("разбор блюда");
    expect(await getBalance(user.userId)).toBe(WELCOME_GRANT_KOP - PRICES_KOP.dish_analysis);
  });

  it("402 when broke", async () => {
    await drain(user.userId);
    const res = await app.inject({ method: "POST", url, headers: user.headers, payload: body });
    expect(res.statusCode).toBe(402);
    expect(await getBalance(user.userId)).toBe(0);
  });

  it("refunds when the analysis fails", async () => {
    mode = "fail";
    const res = await app.inject({ method: "POST", url, headers: user.headers, payload: body });
    expect(res.statusCode).toBe(502);
    // charged then refunded
    expect(await waitForBalance(user.userId, WELCOME_GRANT_KOP)).toBe(WELCOME_GRANT_KOP);
  });
});

// ─── analyze-daily (single JSON, injected stub) ───

describeIfReady("POST /api/analyze/daily — billing", () => {
  let app: FastifyInstance;
  let user: TestUser;
  let mode: "ok" | "fail" = "ok";

  const okResponse = JSON.stringify({
    summary: "разбор дня",
    insights: [],
    hypotheses: [],
  });

  beforeAll(async () => {
    if (!ready) return;
    const { analyzeDailyRoutes } = await import("../../api/routes/analyze-daily.js");
    app = Fastify({ logger: false });
    await app.register(
      async (instance) => {
        await analyzeDailyRoutes(instance, {
          callLLM: async () => {
            if (mode === "fail") throw new Error("upstream down");
            return okResponse;
          },
        });
      },
      { prefix: "/api" },
    );
    await app.ready();
  });
  afterAll(async () => {
    if (!ready) return;
    await app?.close();
  });
  beforeEach(async () => {
    await truncateAllUserData(pool);
    user = await createTestUser();
    mode = "ok";
  });

  const url = "/api/analyze/daily";
  const body = {
    date: "15-05-2026",
    scheduleFoods: [{ name: "Овсянка", time: "08:00" }],
    scheduleEvents: [],
  };

  it("debits daily_analysis on a successful analysis", async () => {
    const res = await app.inject({ method: "POST", url, headers: user.headers, payload: body });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("разбор дня");
    expect(await getBalance(user.userId)).toBe(WELCOME_GRANT_KOP - PRICES_KOP.daily_analysis);
  });

  it("402 when broke", async () => {
    await drain(user.userId);
    const res = await app.inject({ method: "POST", url, headers: user.headers, payload: body });
    expect(res.statusCode).toBe(402);
    expect(await getBalance(user.userId)).toBe(0);
  });

  it("refunds when the model call fails", async () => {
    mode = "fail";
    const res = await app.inject({ method: "POST", url, headers: user.headers, payload: body });
    expect(res.statusCode).toBe(502);
    expect(res.body).toContain("analysis-failed");
    // charged then refunded
    expect(await waitForBalance(user.userId, WELCOME_GRANT_KOP)).toBe(WELCOME_GRANT_KOP);
  });
});

// ─── analyze (long, background job) ───

describeIfReady("POST /api/analyze — billing", () => {
  let app: FastifyInstance;
  let user: TestUser;
  let mockCallLLM: ReturnType<typeof vi.fn>;

  const validResponse = JSON.stringify({
    summary: "## ok",
    insights: [],
    hypotheses: [],
  });

  async function pollResultMd(id: string): Promise<string> {
    for (let i = 0; i < 100; i++) {
      const res = await app.inject({
        method: "GET",
        url: `/api/analyses/${id}`,
        headers: user.headers,
      });
      const md = (res.json() as { analysis: { result_md: string } }).analysis.result_md;
      if (md !== "") return md;
      await new Promise((r) => setTimeout(r, 20));
    }
    throw new Error("never done");
  }

  const validWindow = {
    windowStart: "2026-05-01T00:00:00Z",
    windowEnd: "2026-05-08T00:00:00Z",
    payload: { scheduleFoods: [], scheduleEvents: [] },
  };

  beforeAll(async () => {
    if (!ready) return;
    const { analyzeRoutes } = await import("../../api/routes/analyze.js");
    app = Fastify({ logger: false });
    mockCallLLM = vi.fn(async () => validResponse);
    await app.register(
      async (instance) => {
        await analyzeRoutes(instance, {
          callLLM: (sys, usr, opts) => mockCallLLM(sys, usr, opts),
        });
      },
      { prefix: "/api" },
    );
    await app.ready();
  });
  afterAll(async () => {
    if (!ready) return;
    await app?.close();
  });
  beforeEach(async () => {
    await truncateAllUserData(pool);
    user = await createTestUser();
    mockCallLLM.mockReset();
    mockCallLLM.mockResolvedValue(validResponse);
  });

  it("debits long_analysis at kickoff", async () => {
    const id = crypto.randomUUID();
    const res = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: { id, ...validWindow },
    });
    expect(res.statusCode).toBe(200);
    expect(await getBalance(user.userId)).toBe(WELCOME_GRANT_KOP - PRICES_KOP.long_analysis);
    await pollResultMd(id); // let the job finish so afterEach truncation is clean
  });

  it("402 at kickoff when broke, and creates no row", async () => {
    await drain(user.userId);
    const id = crypto.randomUUID();
    const res = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: { id, ...validWindow },
    });
    expect(res.statusCode).toBe(402);

    const get = await app.inject({
      method: "GET",
      url: `/api/analyses/${id}`,
      headers: user.headers,
    });
    expect(get.statusCode).toBe(404); // no orphan pending row
  });

  it("refunds when the background job fails", async () => {
    mockCallLLM.mockResolvedValue("not json at all"); // invalid twice → job fails
    const id = crypto.randomUUID();
    await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: { id, ...validWindow },
    });
    const md = await pollResultMd(id);
    expect(md).toMatch(/^⚠️/);
    // charged at kickoff, refunded by the failing background job (post-response)
    expect(await waitForBalance(user.userId, WELCOME_GRANT_KOP)).toBe(WELCOME_GRANT_KOP);
  });

  it("does not double-charge a duplicate (same id) POST", async () => {
    const id = crypto.randomUUID();
    await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: { id, ...validWindow },
    });
    await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: { id, ...validWindow },
    });
    await pollResultMd(id);
    expect(await getBalance(user.userId)).toBe(WELCOME_GRANT_KOP - PRICES_KOP.long_analysis);
  });
});
