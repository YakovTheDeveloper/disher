import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestUser, type TestUser } from "../../../test/auth-helpers.js";
import {
  analyzeDailyRoutes,
  buildDailyUserPrompt,
  runDailySSE,
  DAILY_SYSTEM_PROMPT,
  type DailyStreamFn,
} from "../analyze-daily.js";

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
});

describe("DAILY_SYSTEM_PROMPT", () => {
  it("is markdown-mode — carries no JSON output contract", () => {
    expect(DAILY_SYSTEM_PROMPT).not.toContain("Верни строго JSON");
    expect(DAILY_SYSTEM_PROMPT).toContain("## Идеи для эксперимента");
  });

  it("includes the dish-details instruction but not the cohort one", () => {
    expect(DAILY_SYSTEM_PROMPT).toContain("[особенности: …]");
    expect(DAILY_SYSTEM_PROMPT).not.toContain("≥20% дней окна");
  });
});

// ─── runDailySSE — SSE contract + client-disconnect abort ───
//
// Tested directly (not via Fastify.inject) because light-my-request resolves
// the whole response at once and cannot model a mid-stream client disconnect.

function makeRaw() {
  const chunks: string[] = [];
  return {
    headStatuses: [] as number[],
    writableEnded: false,
    destroyed: false,
    writeHead(status: number, _headers: Record<string, string>) {
      this.headStatuses.push(status);
    },
    write(data: string | Uint8Array): boolean {
      chunks.push(
        typeof data === "string" ? data : Buffer.from(data).toString("utf8"),
      );
      return true;
    },
    end() {
      this.writableEnded = true;
    },
    get output() {
      return chunks.join("");
    },
  };
}

function makeSocket() {
  let handler: (() => void) | null = null;
  return {
    on(_event: "close", cb: () => void) {
      handler = cb;
    },
    off(_event: "close", cb: () => void) {
      if (handler === cb) handler = null;
    },
    emitClose() {
      handler?.();
    },
  };
}

const abortError = () =>
  Object.assign(new Error("operation aborted"), { name: "AbortError" });

describe("runDailySSE", () => {
  it("forwards LLM frames and appends the terminal [DONE] + end()", async () => {
    const raw = makeRaw();
    const socket = makeSocket();
    const streamLLM: DailyStreamFn = async (_prompt, write) => {
      write('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n');
      write('data: {"choices":[{"delta":{"content":" there"}}]}\n\n');
    };

    await runDailySSE({ userPrompt: "x", raw, socket, streamLLM });

    expect(raw.headStatuses).toEqual([200]);
    expect(raw.output).toContain('"content":"Hi"');
    expect(raw.output).toContain('"content":" there"');
    expect(raw.output.endsWith("data: [DONE]\n\n")).toBe(true);
    expect(raw.writableEnded).toBe(true);
  });

  it("converts an upstream throw into an event: error frame", async () => {
    const raw = makeRaw();
    const socket = makeSocket();
    const streamLLM: DailyStreamFn = async () => {
      throw new Error("OpenRouter 503: upstream down");
    };

    await runDailySSE({ userPrompt: "x", raw, socket, streamLLM });

    expect(raw.output).toContain("event: error");
    expect(raw.output).toContain("OpenRouter 503: upstream down");
    expect(raw.output).toContain("data: [DONE]\n\n");
    expect(raw.writableEnded).toBe(true);
  });

  it("aborts the upstream signal when the client socket closes", async () => {
    const raw = makeRaw();
    const socket = makeSocket();
    let capturedSignal: AbortSignal | undefined;

    const streamLLM: DailyStreamFn = (_prompt, _write, signal) => {
      capturedSignal = signal;
      return new Promise<void>((_resolve, reject) => {
        if (signal.aborted) return reject(abortError());
        signal.addEventListener("abort", () => reject(abortError()));
      });
    };

    const promise = runDailySSE({ userPrompt: "x", raw, socket, streamLLM });

    // Simulate the client disconnecting mid-stream: the socket is dead and
    // its 'close' event fires.
    raw.destroyed = true;
    socket.emitClose();

    await promise;

    expect(capturedSignal?.aborted).toBe(true);
    // The socket is gone — nothing (not even [DONE]) was written after close.
    expect(raw.writableEnded).toBe(false);
    expect(raw.output).not.toContain("[DONE]");
  });

  it("does not throw write-after-end when the socket dies before finally", async () => {
    const raw = makeRaw();
    const socket = makeSocket();
    const streamLLM: DailyStreamFn = async (_prompt, write) => {
      write('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n');
      // Client leaves right here.
      raw.destroyed = true;
      socket.emitClose();
      throw abortError();
    };

    // The assertion is simply that this resolves without an unhandled throw.
    await expect(
      runDailySSE({ userPrompt: "x", raw, socket, streamLLM }),
    ).resolves.toBeUndefined();
    expect(raw.writableEnded).toBe(false);
  });
});

// ─── Route — auth + request validation (needs an auth DB for the bearer) ───

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

describeIfReady("POST /api/analyze/daily — route", () => {
  let app: FastifyInstance;
  let user: TestUser;

  const stubStream: DailyStreamFn = async (_prompt, write) => {
    write('data: {"choices":[{"delta":{"content":"разбор дня"}}]}\n\n');
  };

  beforeAll(async () => {
    if (!ready) return;
    app = Fastify({ logger: false });
    await app.register(
      async (instance) => {
        await analyzeDailyRoutes(instance, { streamLLM: stubStream });
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

  it("accepts a day with food but no events (events-free day is valid)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/analyze/daily",
      headers: user.headers,
      payload: nonEmptyBody,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("разбор дня");
    expect(res.body).toContain("data: [DONE]");
  });
});
