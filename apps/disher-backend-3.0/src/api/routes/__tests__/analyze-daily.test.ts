import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestUser, type TestUser } from "../../../test/auth-helpers.js";
import {
  analyzeDailyRoutes,
  buildDailyUserPrompt,
  DAILY_SYSTEM_PROMPT,
} from "../analyze-daily.js";
import type { CallLLM } from "../analyze.runJob.js";

// ─── buildDailyUserPrompt — pure helper ───

describe("buildDailyUserPrompt", () => {
  it("puts the date on the first line", () => {
    const out = buildDailyUserPrompt("15-05-2026", [], [], []);
    expect(out).toMatch(/^День: 15-05-2026$/m);
  });

  it("embeds hydrated food/event arrays as JSON with counts", () => {
    const foods = [{ name: "Овсянка", time: "08:00", quantity: 200 }];
    const events = [{ time: "10:00", text: "Головная боль" }];
    const out = buildDailyUserPrompt("15-05-2026", foods, events, []);
    expect(out).toContain("Приёмы пищи за день (1):");
    expect(out).toContain('"name":"Овсянка"');
    expect(out).toContain("События и теги за день (1):");
    expect(out).toContain("Головная боль");
  });

  it("renders hypotheses as a bullet list when present", () => {
    const out = buildDailyUserPrompt("15-05-2026", [], [], [
      { title: "Без молочки", body: "убрать молоко на день" },
    ]);
    expect(out).toContain("Гипотезы, которые юзер хочет проверить");
    expect(out).toContain("- Без молочки: убрать молоко на день");
  });

  it("omits the hypotheses block entirely when none are given", () => {
    const out = buildDailyUserPrompt("15-05-2026", [], [], []);
    expect(out).not.toContain("Гипотезы");
  });

  it("renders the nutrient anchor lines with name/amount/unit + norm", () => {
    const out = buildDailyUserPrompt("15-05-2026", [], [], [], [
      { name: "Белки", amount: 95, unit: "г", norm: 51 },
      { name: "Цинк", amount: 6.2, unit: "мг", norm: null },
    ]);
    expect(out).toContain("Ориентировочные суммы нутриентов за день");
    expect(out).toContain("- Белки 95 г (норма ~51)");
    // norm omitted when null.
    expect(out).toContain("- Цинк 6.2 мг");
    expect(out).not.toContain("Цинк 6.2 мг (норма");
  });

  it("omits the nutrient block when no lines are given", () => {
    const out = buildDailyUserPrompt("15-05-2026", [], [], []);
    expect(out).not.toContain("суммы нутриентов");
  });

  it("renders the user-message section when present", () => {
    const out = buildDailyUserPrompt(
      "15-05-2026",
      [],
      [],
      [],
      [],
      "Обрати внимание на сахар после обеда",
    );
    expect(out).toContain("Уточнения от пользователя");
    expect(out).toContain("Обрати внимание на сахар после обеда");
  });

  it("omits the user-message section when empty", () => {
    const out = buildDailyUserPrompt("15-05-2026", [], [], []);
    expect(out).not.toContain("Уточнения от пользователя");
  });
});

describe("DAILY_SYSTEM_PROMPT", () => {
  it("carries the shared structured-output JSON contract", () => {
    expect(DAILY_SYSTEM_PROMPT).toContain("Верни строго JSON");
    expect(DAILY_SYSTEM_PROMPT).toContain("summary");
    expect(DAILY_SYSTEM_PROMPT).toContain("insights");
    expect(DAILY_SYSTEM_PROMPT).toContain("hypotheses");
    expect(DAILY_SYSTEM_PROMPT).toContain("evidence");
  });

  it("includes the dish-details instruction but not the cohort one", () => {
    expect(DAILY_SYSTEM_PROMPT).toContain("[особенности: …]");
    expect(DAILY_SYSTEM_PROMPT).not.toContain("≥20% дней окна");
  });

  it("tells the model to read event text + suspected cause (single-day, no cohort)", () => {
    expect(DAILY_SYSTEM_PROMPT).toContain("предполагаемую причину");
    expect(DAILY_SYSTEM_PROMPT).toContain("гипотезой юзера, а не фактом");
    // Single-day analysis must NOT borrow the cross-day clustering clause.
    expect(DAILY_SYSTEM_PROMPT).not.toContain("Кластеризуй повторяющиеся явления");
  });

  it("carries the nutrient-anchor instruction (numbers are approximate, not a table)", () => {
    expect(DAILY_SYSTEM_PROMPT).toContain("ОРИЕНТИРОВОЧНЫЕ суммы нутриентов");
    expect(DAILY_SYSTEM_PROMPT).toContain("НЕ превращай ответ в таблицу БЖУ");
  });
});

// ─── Route — auth + validation + structured JSON (needs an auth DB for bearer) ───

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

describeIfReady("POST /api/analyze/daily — route", () => {
  let app: FastifyInstance;
  let user: TestUser;

  let capturedPrompt = "";
  const stubLLM: CallLLM = async (_sys, usr) => {
    capturedPrompt = usr;
    return JSON.stringify({
      summary: "разбор дня",
      observations: [
        {
          title: "поздний ужин",
          detail: "ужин в 22:00",
          strength: "weak",
          evidence: { days: ["15-05-2026"] },
        },
      ],
      insights: [
        {
          title: "железо + витамин C",
          detail: "лучше усвоение",
          valence: "positive",
          strength: "moderate",
          evidence: { days: ["15-05-2026"], foods: ["говядина"] },
        },
      ],
      hypotheses: [],
    });
  };

  beforeAll(async () => {
    if (!ready) return;
    app = Fastify({ logger: false });
    await app.register(
      async (instance) => {
        await analyzeDailyRoutes(instance, { callLLM: stubLLM });
      },
      { prefix: "/api" },
    );
    await app.ready();
    user = await createTestUser();
  });

  afterAll(async () => {
    if (!ready) return;
    await app?.close();
  });

  const nonEmptyBody = {
    date: "15-05-2026",
    scheduleFoods: [{ name: "Овсянка", time: "08:00" }],
    scheduleEvents: [],
  };

  it("rejects an unauthenticated request with 401", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/analyze/daily",
      payload: nonEmptyBody,
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects an empty day (no foods AND no events) with 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/analyze/daily",
      headers: user.headers,
      payload: { date: "15-05-2026", scheduleFoods: [], scheduleEvents: [] },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns the parsed structured analysis for a valid day", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/analyze/daily",
      headers: user.headers,
      payload: nonEmptyBody,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      analysis: {
        summary: string;
        observations: unknown[];
        insights: unknown[];
        hypotheses: unknown[];
      };
    };
    expect(body.analysis.summary).toBe("разбор дня");
    expect(body.analysis.observations).toHaveLength(1);
    expect(body.analysis.insights).toHaveLength(1);
    expect(body.analysis.hypotheses).toEqual([]);
  });

  it("clamps an over-long userMessage to 1000 chars before the prompt", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/analyze/daily",
      headers: user.headers,
      payload: { ...nonEmptyBody, userMessage: "я".repeat(1500) },
    });
    expect(res.statusCode).toBe(200);
    const marker = "Уточнения от пользователя — учти при разборе:";
    const section = (capturedPrompt.split(marker)[1] ?? "").trim();
    expect(section.length).toBe(1000);
  });
});
