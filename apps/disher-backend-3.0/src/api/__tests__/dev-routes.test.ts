import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildApp, type BuiltApp } from "../buildApp.js";

// C2.5 — dev-only route guard contract:
//
//   - In dev (NODE_ENV !== 'production'), GET /api/dev/verify-tokens returns
//     the token stashed by sendVerificationEmail callback for a given email,
//     or 404 if none has been recorded.
//   - In production, the route is NOT registered (404 from "not found" page,
//     not from our handler).
//   - As a defense-in-depth, even if registration leaks (e.g. NODE_ENV gets
//     unset after boot), the handler itself returns 404 when NODE_ENV is
//     'production' at request time.
//
// The endpoint exists ONLY to support the SPA E2E bridge (`__e2e.verifyEmail`)
// — never invoked by real users.

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

type VerifyTokenMap = Map<
  string,
  { url: string; frontendUrl: string; token: string }
>;

function getVerifyMap(): VerifyTokenMap {
  const g = globalThis as { __verifyTokensByEmail?: VerifyTokenMap };
  if (!g.__verifyTokensByEmail) g.__verifyTokensByEmail = new Map();
  return g.__verifyTokensByEmail;
}

describeIfReady("C2.5 dev verify-tokens route", () => {
  let app: BuiltApp;

  beforeAll(async () => {
    process.env.BETTER_AUTH_SECRET ??= "a".repeat(64);
    // Tests run with NODE_ENV unset (or 'test') — registration happens.
    app = await buildApp({ logger: false, https: false });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    getVerifyMap().clear();
  });

  it("returns the token for a known email", async () => {
    const email = "dev-known@example.com";
    getVerifyMap().set(email, {
      url: "http://localhost:3100/api/auth/verify-email?token=jwt-x",
      frontendUrl: "http://localhost:5173/auth/verify-email?token=jwt-x",
      token: "jwt-x",
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/dev/verify-tokens?email=${encodeURIComponent(email)}`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { token: string; frontendUrl: string };
    expect(body.token).toBe("jwt-x");
    expect(body.frontendUrl).toContain("/auth/verify-email?token=");
  });

  it("returns 404 for an unknown email", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/dev/verify-tokens?email=nobody@example.com",
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 400 when email query param is missing", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/dev/verify-tokens",
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 when NODE_ENV is 'production' at request time", async () => {
    // Simulate a misconfigured deploy where NODE_ENV becomes 'production'
    // after boot. Registration already happened, but the handler must still
    // refuse to leak tokens.
    const email = "guard-test@example.com";
    getVerifyMap().set(email, {
      url: "x",
      frontendUrl: "y",
      token: "should-not-leak",
    });

    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/dev/verify-tokens?email=${encodeURIComponent(email)}`,
      });
      expect(res.statusCode).toBe(404);
      const blob = JSON.stringify(res.json());
      expect(blob).not.toContain("should-not-leak");
    } finally {
      process.env.NODE_ENV = prev;
    }
  });
});
