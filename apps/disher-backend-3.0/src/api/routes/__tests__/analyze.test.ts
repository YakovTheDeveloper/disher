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
  summary: "## ok",
  observations: [
    {
      title: "obs",
      detail: "od",
      strength: "weak",
      evidence: { days: ["07-04-2026"] },
    },
  ],
  insights: [
    {
      title: "ins",
      detail: "d",
      valence: "positive",
      strength: "moderate",
      evidence: { days: ["07-04-2026"] },
    },
  ],
  hypotheses: [{ title: "idea", body: "body", suggestedDays: 7 }],
});

type AnalysisResponse = {
  analysis: {
    id: string;
    user_id: string;
    window_start: string;
    window_end: string;
    result_md: string;
    idea_cards: unknown;
    insights: unknown;
    observations: unknown;
    applied_hypotheses: unknown;
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

  it("DELETE removes the row; a follow-up GET is 404", async () => {
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

    const del = await app.inject({
      method: "DELETE",
      url: `/api/analyses/${id}`,
      headers: user.headers,
    });
    expect(del.statusCode).toBe(200);
    expect(del.json()).toEqual({ ok: true });

    const after = await app.inject({
      method: "GET",
      url: `/api/analyses/${id}`,
      headers: user.headers,
    });
    expect(after.statusCode).toBe(404);

    // Second delete of the same id — already gone → 404.
    const delAgain = await app.inject({
      method: "DELETE",
      url: `/api/analyses/${id}`,
      headers: user.headers,
    });
    expect(delAgain.statusCode).toBe(404);
  });

  it("DELETE for another user's analysis returns 404 and leaves it intact", async () => {
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

    // The other user must not be able to delete it.
    const del = await app.inject({
      method: "DELETE",
      url: `/api/analyses/${id}`,
      headers: otherUser.headers,
    });
    expect(del.statusCode).toBe(404);

    // The owner can still read it — the row survived.
    const stillThere = await app.inject({
      method: "GET",
      url: `/api/analyses/${id}`,
      headers: user.headers,
    });
    expect(stillThere.statusCode).toBe(200);
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

  it("hypotheses reach the LLM prompt and are snapshotted (id not leaked)", async () => {
    const id = crypto.randomUUID();
    const res = await app.inject({
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
            { id: "h-1", title: "no dairy", body: "stop milk for a week" },
          ],
        },
      },
    });
    // The snapshot is stored verbatim ({id,title,body}).
    expect(
      (res.json() as AnalysisResponse).analysis.applied_hypotheses,
    ).toEqual([{ id: "h-1", title: "no dairy", body: "stop milk for a week" }]);
    await pollUntilDone(id, user.headers);
    const userPromptArg = mockCallLLM.mock.calls[0]?.[1] as string;
    expect(userPromptArg).toContain("<hypotheses>");
    expect(userPromptArg).toContain("no dairy");
    // The id is snapshot-only bookkeeping — it must NOT reach the LLM prompt.
    expect(userPromptArg).not.toContain("h-1");
  });

  it("the system prompt carries the events-mining instruction (not just the constant)", async () => {
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
    // calls[0][0] = system prompt actually handed to the LLM for the long job.
    const systemPromptArg = mockCallLLM.mock.calls[0]?.[0] as string;
    expect(systemPromptArg).toContain("Кластеризуй повторяющиеся явления");
    expect(systemPromptArg).toContain("это ГИПОТЕЗА юзера, а не факт");
  });

  it("nutrientsByDay reaches the LLM prompt as per-day anchor lines", async () => {
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
          nutrientsByDay: [
            {
              date: "01-05-2026",
              nutrients: [{ name: "Белки", amount: 88, unit: "г", norm: 51 }],
            },
          ],
        },
      },
    });
    await pollUntilDone(id, user.headers);
    const userPromptArg = mockCallLLM.mock.calls[0]?.[1] as string;
    expect(userPromptArg).toContain("суммы нутриентов по дням");
    expect(userPromptArg).toContain("01-05-2026: Белки 88 г (норма ~51)");
  });

  it("rejects a window below the 1-day floor (end before start) with 400", async () => {
    // Floor is now 1 day (daily flow). Span < 1 only happens with end before
    // start → negative inclusive span → below the floor.
    const res = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id: crypto.randomUUID(),
        windowStart: "2026-05-08T00:00:00Z",
        windowEnd: "2026-05-01T00:00:00Z",
        payload: { scheduleFoods: [], scheduleEvents: [] },
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects a window longer than 35 days with 400", async () => {
    // 01-04 … 06-05 — 35 days apart = 36 inclusive days, just over the cap.
    const res = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id: crypto.randomUUID(),
        windowStart: "2026-04-01T00:00:00Z",
        windowEnd: "2026-05-06T00:00:00Z",
        payload: { scheduleFoods: [], scheduleEvents: [] },
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("accepts a window of exactly 7 and exactly 35 inclusive days", async () => {
    // 7 inclusive days = endpoints 6 days apart (the «7 дней» preset).
    const r7 = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id: crypto.randomUUID(),
        windowStart: "2026-05-01T00:00:00Z",
        windowEnd: "2026-05-07T00:00:00Z",
        payload: { scheduleFoods: [], scheduleEvents: [] },
      },
    });
    expect(r7.statusCode).toBe(200);
    // 35 inclusive days = endpoints 34 days apart.
    const r35 = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id: crypto.randomUUID(),
        windowStart: "2026-04-01T00:00:00Z",
        windowEnd: "2026-05-05T00:00:00Z",
        payload: { scheduleFoods: [], scheduleEvents: [] },
      },
    });
    expect(r35.statusCode).toBe(200);
  });

  it("daily window (windowStart === windowEnd) uses the daily prompt, not the cohort one", async () => {
    const id = crypto.randomUUID();
    const res = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id,
        windowStart: "2026-05-01T00:00:00Z",
        windowEnd: "2026-05-01T00:00:00Z",
        payload: {
          scheduleFoods: [{ name: "овсянка" }],
          scheduleEvents: [],
        },
      },
    });
    expect(res.statusCode).toBe(200);
    await pollUntilDone(id, user.headers);
    const systemPromptArg = mockCallLLM.mock.calls[0]?.[0] as string;
    // Daily-prompt fingerprint present…
    expect(systemPromptArg).toContain("Это разбор одного дня, не недельный");
    // …and the weekly cohort-mining paragraph absent (its ≥20%-of-days gate).
    expect(systemPromptArg).not.toContain("стройте когорты");
    expect(systemPromptArg).not.toContain("Кластеризуй повторяющиеся явления");
  });

  it("daily window folds payload.userMessage into the prompt, clamped to 1000 chars", async () => {
    const id = crypto.randomUUID();
    const long = "уточнение " + "x".repeat(2000);
    await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id,
        windowStart: "2026-05-01T00:00:00Z",
        windowEnd: "2026-05-01T00:00:00Z",
        payload: {
          scheduleFoods: [{ name: "овсянка" }],
          scheduleEvents: [],
          userMessage: long,
        },
      },
    });
    await pollUntilDone(id, user.headers);
    const userPromptArg = mockCallLLM.mock.calls[0]?.[1] as string;
    expect(userPromptArg).toContain("Уточнения от пользователя");
    expect(userPromptArg).toContain("уточнение");
    // Clamp: the section carries at most USER_MESSAGE_MAX (1000) chars of the
    // message, so the full 2010-char paste never lands whole.
    expect(userPromptArg).not.toContain("x".repeat(1001));
  });

  it("weekly window (>= 7 days) still uses the cohort base prompt (regression)", async () => {
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
    const systemPromptArg = mockCallLLM.mock.calls[0]?.[0] as string;
    expect(systemPromptArg).toContain("стройте когорты");
    expect(systemPromptArg).not.toContain("Это разбор одного дня, не недельный");
  });

  it("accepts a same-day window (span 1) with 200", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id: crypto.randomUUID(),
        windowStart: "2026-05-01T00:00:00Z",
        windowEnd: "2026-05-01T00:00:00Z",
        payload: { scheduleFoods: [{ name: "овсянка" }], scheduleEvents: [] },
      },
    });
    expect(res.statusCode).toBe(200);
  });

  it("empty daily window short-circuits: LLM is never called, row resolves to «День пустой»", async () => {
    const id = crypto.randomUUID();
    await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id,
        windowStart: "2026-05-01T00:00:00Z",
        windowEnd: "2026-05-01T00:00:00Z",
        payload: { scheduleFoods: [], scheduleEvents: [] },
      },
    });
    const final = await pollUntilDone(id, user.headers);
    expect(final.result_md).toContain("День пустой");
    expect(mockCallLLM).not.toHaveBeenCalled();
  });

  it("GET /api/analyses returns pending, failed and done windows", async () => {
    const idDone = crypto.randomUUID();
    const idFailed = crypto.randomUUID();
    const idPending = crypto.randomUUID();

    // One successful analysis (beforeEach default mock returns validResponse).
    await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id: idDone,
        windowStart: "2026-05-01T00:00:00Z",
        windowEnd: "2026-05-08T00:00:00Z",
        payload: { scheduleFoods: [], scheduleEvents: [] },
      },
    });
    await pollUntilDone(idDone, user.headers);

    // One failed analysis — every LLM call returns garbage so both the first
    // attempt and the retry fail; runJob writes a "⚠️"-prefixed result_md.
    mockCallLLM.mockResolvedValue("not-json-not-valid");
    await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id: idFailed,
        windowStart: "2026-04-10T00:00:00Z",
        windowEnd: "2026-04-17T00:00:00Z",
        payload: { scheduleFoods: [], scheduleEvents: [] },
      },
    });
    await pollUntilDone(idFailed, user.headers);

    // One pending analysis — the LLM call hangs until released.
    let releasePending = () => {};
    mockCallLLM.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          releasePending = () => resolve(validResponse);
        }),
    );
    await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: user.headers,
      payload: {
        id: idPending,
        windowStart: "2026-04-01T00:00:00Z",
        windowEnd: "2026-04-08T00:00:00Z",
        payload: { scheduleFoods: [], scheduleEvents: [] },
      },
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/analyses",
      headers: user.headers,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      analyses: Array<{
        id: string;
        result_md: string;
        idea_cards: unknown;
        insights: unknown;
        observations: unknown;
        applied_hypotheses: unknown;
      }>;
    };
    // The done-only filter is gone — all three rows are listed.
    const byId = new Map(body.analyses.map((a) => [a.id, a]));
    expect(byId.size).toBe(3);
    expect(byId.get(idPending)?.result_md).toBe("");
    expect(byId.get(idFailed)?.result_md).toMatch(/^⚠️/);
    expect(byId.get(idDone)?.result_md).toBe("## ok");
    // result_md + idea_cards (hypotheses) + insights + applied_hypotheses are
    // projected into the list.
    expect(byId.get(idDone)).toHaveProperty("result_md");
    expect(byId.get(idDone)?.idea_cards).toEqual([
      { title: "idea", body: "body", suggestedDays: 7 },
    ]);
    expect(byId.get(idDone)?.insights).toEqual([
      { title: "ins", detail: "d", valence: "positive", strength: "moderate", evidence: { days: ["07-04-2026"] } },
    ]);
    // Neutral observations ride in their own column, separate from insights.
    expect(byId.get(idDone)?.observations).toEqual([
      { title: "obs", detail: "od", strength: "weak", evidence: { days: ["07-04-2026"] } },
    ]);
    expect(byId.get(idDone)?.applied_hypotheses).toEqual([]);

    // Release the still-pending job so afterAll can clean up cleanly.
    releasePending();
  });
});
