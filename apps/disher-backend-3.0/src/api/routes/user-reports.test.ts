import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { AJV_OPTIONS } from "../ajv-options.js";

// The prod route is auth-gated (requireUser → verifyUserSession) and writes to
// pg. Mock both boundaries: a fake pool captures the INSERT params, and the
// session verifier gates on the presence of a session cookie so we can exercise
// the 401 path and the happy path without a real session store.
const query = vi.fn().mockResolvedValue({ rows: [] });
vi.mock("../db.js", () => ({ pool: { query } }));

const TEST_USER_ID = "11111111-1111-4111-8111-111111111111";
vi.mock("../../auth/verify-session.js", () => ({
  verifyUserSession: vi.fn(async (req, reply) => {
    const cookie = req.headers.cookie as string | undefined;
    if (!cookie?.includes("session_token=")) {
      reply.status(401).send({ error: "Invalid or expired session" });
      return null;
    }
    return { userId: TEST_USER_ID, role: null };
  }),
}));

const { userReportsRoutes } = await import("./user-reports.js");

const url = "/api/user-reports/";
const AUTH = { cookie: "disher.session_token=test-token" };

// `ajv: AJV_OPTIONS` is not decoration — a bare `Fastify()` validates with
// Fastify's DEFAULTS, which disagree with ours on coerceTypes. Without this the
// suite below tests an app we do not ship.
async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ ajv: AJV_OPTIONS });
  app.decorateRequest("userId", "");
  await app.register(userReportsRoutes, { prefix: "/api/user-reports" });
  await app.ready();
  return app;
}

// Latest INSERT's bound params: [id, user_id, text, page, screen_size, ua, pwa].
function lastParams(): unknown[] {
  const call = query.mock.calls.at(-1);
  if (!call) throw new Error("pool.query was not called");
  return call[1] as unknown[];
}

beforeEach(() => {
  query.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
  query.mockResolvedValue({ rows: [] });
});

describe("POST /api/user-reports — auth gate", () => {
  it("401s without a session cookie, writes nothing", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, payload: { text: "hi" } });
    expect(res.statusCode).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });
});

describe("POST /api/user-reports — validation", () => {
  it("400 (schema) when text is missing", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url, headers: AUTH, payload: {} });
    expect(res.statusCode).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("400 when text is whitespace-only, with the {error} body the frontend reads", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url,
      headers: AUTH,
      payload: { text: "   " },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: "text is required" });
    expect(query).not.toHaveBeenCalled();
  });

  // The two ajv options this route's behaviour hangs on pull in OPPOSITE
  // directions, so both are pinned here.
  //
  // coerceTypes is OFF (api/ajv-options.ts), against Fastify's default: a
  // wrong-typed `text` is REJECTED, not coerced to "123". This test used to
  // assert the coercion — and passed, because it built a bare `Fastify()` whose
  // defaults are not ours. It was green while pinning the opposite of prod.
  it("rejects a wrong-typed text — coerceTypes is off (NOT Fastify's default)", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url,
      headers: AUTH,
      payload: { text: 123 },
    });
    expect(res.statusCode).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("strips an unexpected extra field, never binding it (removeAdditional)", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url,
      headers: AUTH,
      payload: { text: "ok", screenshot: "data:image/png;base64,AAAA" },
    });
    expect(res.statusCode).toBe(200);
    // 7 bound params exactly (id, user_id, text, page, screen_size, ua, pwa) —
    // the stripped `screenshot` never reaches the query.
    expect(lastParams()).toHaveLength(7);
    expect(lastParams()).not.toContain("data:image/png;base64,AAAA");
  });
});

describe("POST /api/user-reports — insert + clamping", () => {
  it("inserts a row tied to the authenticated user and returns ok", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url,
      headers: AUTH,
      payload: {
        text: "  something broke  ",
        page: "/home",
        screenSize: "390x844",
        userAgent: "Mozilla/5.0",
        pwa: "standalone=true display-mode=standalone",
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true });

    const p = lastParams();
    expect(p[1]).toBe(TEST_USER_ID); // user_id
    expect(p[2]).toBe("something broke"); // trimmed text
    expect(p[3]).toBe("/home");
    expect(p[5]).toBe("Mozilla/5.0"); // user_agent from body
  });

  it("truncates text to 4000 and metadata to 512", async () => {
    const app = await buildApp();
    await app.inject({
      method: "POST",
      url,
      headers: AUTH,
      payload: {
        text: "t".repeat(5000),
        page: "p".repeat(1000),
        userAgent: "u".repeat(1000),
      },
    });
    const p = lastParams();
    expect((p[2] as string).length).toBe(4000); // MAX_TEXT
    expect((p[3] as string).length).toBe(512); // MAX_META
    expect((p[5] as string).length).toBe(512); // body UA, clamped
  });

  it("falls back to the UA header AND still clamps it to 512 (no bypass)", async () => {
    const app = await buildApp();
    await app.inject({
      method: "POST",
      url,
      headers: { ...AUTH, "user-agent": "H".repeat(1000) },
      payload: { text: "no ua in body" }, // userAgent omitted → header fallback
    });
    const p = lastParams();
    expect((p[5] as string).length).toBe(512);
  });
});
