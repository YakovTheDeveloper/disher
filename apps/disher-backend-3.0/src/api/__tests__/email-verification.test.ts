import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildApp, type BuiltApp } from "../buildApp.js";
import { auth } from "../../auth/server.js";
import { makeTestPool, truncateAllUserData } from "../../test/db-helpers.js";

// C1 — email-verification contract tests for the better-auth flow:
//
//   signUp (no session) → sendVerificationEmail callback fires
//                       → signIn before verify is rejected (403)
//                       → verifyEmail click consumes token
//                       → autoSignInAfterVerification issues a bearer
//                       → emailVerified=true in DB
//
// We hit the production `auth` instance + the live HTTP routes via
// app.inject() to keep the contract identical to what the SPA sees. The
// dev-stub `sendVerificationEmail` callback in auth/server.ts stashes the
// JWT token in `globalThis.__verifyTokensByEmail` — the same hook that
// powers `createTestUser` for the rest of the suite.

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

type VerifyTokenMap = Map<string, { url: string; token: string }>;

function getVerifyMap(): VerifyTokenMap {
  const g = globalThis as { __verifyTokensByEmail?: VerifyTokenMap };
  if (!g.__verifyTokensByEmail) g.__verifyTokensByEmail = new Map();
  return g.__verifyTokensByEmail;
}

describeIfReady("C1 email-verification contract", () => {
  let app: BuiltApp;
  let pool: ReturnType<typeof makeTestPool>;

  beforeAll(async () => {
    process.env.BETTER_AUTH_SECRET ??= "a".repeat(64);
    app = await buildApp({ logger: false, https: false });
    pool = makeTestPool();
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  beforeEach(async () => {
    await truncateAllUserData(pool);
    getVerifyMap().clear();
  });

  it("signUp fires sendVerificationEmail callback with a JWT token", async () => {
    const email = "callback-fires@example.com";
    const map = getVerifyMap();
    expect(map.has(email)).toBe(false);

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      headers: { "content-type": "application/json" },
      payload: { email, password: "test-password-12345", name: "Cb" },
    });
    expect(res.statusCode).toBe(200);

    const entry = map.get(email);
    expect(entry).toBeTruthy();
    expect(entry!.token).toMatch(/^eyJ[A-Za-z0-9_-]+\./);
    expect(entry!.url).toContain("/api/auth/verify-email?token=");
  });

  it("signIn before verify is rejected (403 EMAIL_NOT_VERIFIED) and no bearer is issued", async () => {
    const email = "preverify@example.com";
    await app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      headers: { "content-type": "application/json" },
      payload: { email, password: "test-password-12345", name: "Pre" },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: { "content-type": "application/json" },
      payload: { email, password: "test-password-12345" },
    });

    expect(res.statusCode).toBe(403);
    expect(res.headers["set-auth-token"]).toBeUndefined();
    const blob = JSON.stringify(res.json()).toLowerCase();
    expect(blob).toContain("verif");
  });

  it("verifyEmail consumes the token, flips emailVerified=true, and (autoSignInAfterVerification) issues a bearer", async () => {
    const email = "verify-flow@example.com";
    await app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      headers: { "content-type": "application/json" },
      payload: { email, password: "test-password-12345", name: "Vf" },
    });
    const entry = getVerifyMap().get(email);
    expect(entry).toBeTruthy();

    const verifyResponse = (await auth.api.verifyEmail({
      query: { token: entry!.token },
      asResponse: true,
    })) as Response;
    expect(verifyResponse.ok).toBe(true);
    const bearer = verifyResponse.headers.get("set-auth-token");
    expect(bearer).toBeTruthy();

    const dbUser = await pool.query<{ emailVerified: boolean }>(
      `select "emailVerified" from users where email = $1`,
      [email],
    );
    expect(dbUser.rows[0].emailVerified).toBe(true);

    // The freshly-issued bearer must work against /api/auth/get-session.
    const session = await app.inject({
      method: "GET",
      url: "/api/auth/get-session",
      headers: { authorization: `Bearer ${bearer}` },
    });
    expect(session.statusCode).toBe(200);
    const body = session.json() as { user: { email: string } };
    expect(body.user.email).toBe(email);
  });

  it("signIn after verify succeeds (bearer issued, emailVerified=true)", async () => {
    const email = "post-verify-signin@example.com";
    await app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      headers: { "content-type": "application/json" },
      payload: { email, password: "test-password-12345", name: "Pv" },
    });
    const entry = getVerifyMap().get(email)!;
    await auth.api.verifyEmail({ query: { token: entry.token } });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: { "content-type": "application/json" },
      payload: { email, password: "test-password-12345" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["set-auth-token"]).toBeTruthy();
  });

  it("verifyEmail with a tampered/invalid token is rejected", async () => {
    const tampered =
      "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImZha2VAZXhhbXBsZS5jb20iLCJpYXQiOjAsImV4cCI6OTk5OTk5OTk5OX0.invalid-signature";

    const response = (await auth.api
      .verifyEmail({ query: { token: tampered }, asResponse: true })
      .catch((err) => err.response ?? err)) as Response;
    // better-auth either rejects with a non-2xx response or throws an
    // APIError carrying a Response — both are acceptable here.
    expect(response.ok).toBe(false);
  });
});
