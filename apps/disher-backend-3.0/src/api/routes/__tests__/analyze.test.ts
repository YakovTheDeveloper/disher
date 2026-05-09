import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestUser, type TestUser } from "../../../test/auth-helpers.js";
import { makeTestPool, truncateAllUserData } from "../../../test/db-helpers.js";

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

let app: FastifyInstance;
let pool: ReturnType<typeof makeTestPool>;
let mockCallLLM: ReturnType<typeof vi.fn>;

const validResponse = JSON.stringify({
  resultMd: "## ok",
  ideaCards: [{ title: "idea", body: "body", days: 7 }],
});

type AnalysisResponse = {
  analysis: {
    id: string;
    user_id: string;
    window_start: string;
    window_end: string;
    result_md: string;
    idea_cards: unknown;
    created_at: string;
  };
};

async function pollUntilDone(
  analysisId: string,
  headers: Record<string, string>,
): Promise<AnalysisResponse["analysis"]> {
  for (let i = 0; i < 100; i++) {
    const res = await app.inject({
      method: "GET",
      url: `/api/analyses/${analysisId}`,
      headers,
    });
    if (res.statusCode === 404) throw new Error("404 during poll");
    const body = res.json() as AnalysisResponse;
    if (body.analysis.result_md !== "") return body.analysis;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error("never done");
}

beforeAll(async () => {
  if (!ready) return;
  const { analyzeRoutes } = await import("../analyze.js");
  app = Fastify({ logger: false });
  mockCallLLM = vi.fn(async () => validResponse);
  await app.register(
    async (instance) => {
      await analyzeRoutes(instance, {
        callLLM: (sys, user, opts) => mockCallLLM(sys, user, opts),
      });
    },
    { prefix: "/api" },
  );
  await app.ready();
  pool = makeTestPool();
});

afterAll(async () => {
  if (!ready) return;
  await app?.close();
  await pool?.end();
});

describeIfReady("/api/analyze + /api/analyses/:id", () => {
  let user: TestUser;

  beforeEach(async () => {
    await truncateAllUserData(pool);
    user = await createTestUser();
    mockCallLLM.mockReset();
    mockCallLLM.mockResolvedValue(validResponse);
  });

  it("POST returns the pending row, GET reaches done", async () => {
    const id = crypto.randomUUID();
    const res = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id,
        windowStart: "2026-05-01T00:00:00Z",
        windowEnd: "2026-05-08T00:00:00Z",
        payload: { scheduleFoods: [], scheduleEvents: [] },
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as AnalysisResponse;
    expect(body.analysis.id).toBe(id);
    expect(body.analysis.result_md).toBe("");

    const final = await pollUntilDone(id, user.headers);
    expect(final.result_md).toBe("## ok");
  });

  it("GET for another user returns 404", async () => {
    const otherUser = await createTestUser();
    const id = crypto.randomUUID();
    await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id,
        windowStart: "2026-05-01T00:00:00Z",
        windowEnd: "2026-05-08T00:00:00Z",
        payload: { scheduleFoods: [], scheduleEvents: [] },
      },
    });
    await pollUntilDone(id, user.headers);

    const res = await app.inject({
      method: "GET",
      url: `/api/analyses/${id}`,
      headers: otherUser.headers,
    });
    expect(res.statusCode).toBe(404);
  });

  it("idempotent: POST same id twice runs LLM exactly once", async () => {
    const id = crypto.randomUUID();
    const body = {
      id,
      windowStart: "2026-05-01T00:00:00Z",
      windowEnd: "2026-05-08T00:00:00Z",
      payload: { scheduleFoods: [], scheduleEvents: [] },
    };
    const r1 = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: body,
    });
    expect(r1.statusCode).toBe(200);
    const r2 = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: body,
    });
    expect(r2.statusCode).toBe(200);
    expect((r2.json() as AnalysisResponse).analysis.id).toBe(id);
    await pollUntilDone(id, user.headers);
    expect(mockCallLLM).toHaveBeenCalledTimes(1);
  });

  it("output validation: invalid → retry → valid", async () => {
    mockCallLLM
      .mockResolvedValueOnce("not json {{")
      .mockResolvedValueOnce(validResponse);
    const id = crypto.randomUUID();
    await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id,
        windowStart: "2026-05-01T00:00:00Z",
        windowEnd: "2026-05-08T00:00:00Z",
        payload: { scheduleFoods: [], scheduleEvents: [] },
      },
    });
    const final = await pollUntilDone(id, user.headers);
    expect(final.result_md).toBe("## ok");
    expect(mockCallLLM).toHaveBeenCalledTimes(2);
  });

  it("output validation: invalid twice → failure as content", async () => {
    mockCallLLM
      .mockResolvedValueOnce("not json")
      .mockResolvedValueOnce("still not json");
    const id = crypto.randomUUID();
    await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id,
        windowStart: "2026-05-01T00:00:00Z",
        windowEnd: "2026-05-08T00:00:00Z",
        payload: { scheduleFoods: [], scheduleEvents: [] },
      },
    });
    const final = await pollUntilDone(id, user.headers);
    expect(final.result_md).toMatch(/^⚠️ Анализ не удался/);
    expect(final.result_md).toContain("invalid-output");
  });

  it("hypotheses payload reaches the LLM prompt", async () => {
    const id = crypto.randomUUID();
    await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id,
        windowStart: "2026-05-01T00:00:00Z",
        windowEnd: "2026-05-08T00:00:00Z",
        payload: {
          scheduleFoods: [],
          scheduleEvents: [],
          hypotheses: [
            {
              title: "no dairy",
              body: "stop milk for a week",
              days: 7,
              startedAt: "2026-04-25T00:00:00Z",
            },
          ],
        },
      },
    });
    await pollUntilDone(id, user.headers);
    const userPromptArg = mockCallLLM.mock.calls[0]?.[1] as string;
    expect(userPromptArg).toContain("<active_hypotheses>");
    expect(userPromptArg).toContain("no dairy");
  });
});
