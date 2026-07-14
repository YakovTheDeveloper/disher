import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { buildApp, type BuiltApp } from "../buildApp.js";
import {
  createTestUser,
  sessionCookieFromInject,
} from "../../test/auth-helpers.js";
import {
  makeTestPool,
  truncateAllUserData,
} from "../../test/db-helpers.js";

// B3.1 — full HTTP route tests for better-auth endpoints mounted at /api/auth/*.
//
// Exercises sign-up / sign-in / sign-out / get-session through the real Fastify
// stack via app.inject() — no mocks. Auth state is verified at two levels:
//  - HTTP response (status + body shape + session cookie in set-cookie)
//  - DB row (session row deleted after sign-out, user row exists after sign-up)
//
// truncateAllUserData in beforeEach wipes users + session + account + verification
// CASCADE so emails do not collide across specs.

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

describeIfReady("better-auth HTTP routes", () => {
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
  });

  describe("POST /api/auth/sign-up/email", () => {
    it("creates an unverified user, returns token=null + user, and persists row", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/sign-up/email",
        headers: { "content-type": "application/json" },
        payload: {
          email: "alice@example.com",
          password: "test-password-12345",
          name: "Alice",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        token: string | null;
        user: { id: string; email: string; name: string };
      };
      // C1 contract: requireEmailVerification + autoSignIn:false → no session
      // is issued at signUp time. No session cookie is set; the client must
      // wait for the verify-email click (or surface "check your inbox").
      expect(body.token).toBeNull();
      expect(sessionCookieFromInject(res)).toBeNull();
      expect(body.user.email).toBe("alice@example.com");
      expect(body.user.name).toBe("Alice");
      expect(body.user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );

      const dbUser = await pool.query<{
        id: string;
        email: string;
        emailVerified: boolean;
      }>(
        `select id, email, "emailVerified" from users where id = $1`,
        [body.user.id],
      );
      expect(dbUser.rows).toHaveLength(1);
      expect(dbUser.rows[0].email).toBe("alice@example.com");
      expect(dbUser.rows[0].emailVerified).toBe(false);
    });

    it("returns 200 for a duplicate email (anti-enumeration; no new row inserted)", async () => {
      // C1 contract: with requireEmailVerification, better-auth swallows the
      // duplicate-email signal and returns 200 with token=null (same shape as
      // a brand-new signUp) so an unauthenticated caller cannot probe which
      // emails are already registered. We assert that no second user row was
      // inserted.
      await createTestUser({ email: "dup@example.com" });

      const before = await pool.query<{ count: string }>(
        `select count(*)::text from users where email = $1`,
        ["dup@example.com"],
      );
      expect(Number(before.rows[0].count)).toBe(1);

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/sign-up/email",
        headers: { "content-type": "application/json" },
        payload: {
          email: "dup@example.com",
          password: "test-password-12345",
          name: "Dup",
        },
      });

      expect(res.statusCode).toBe(200);
      expect(sessionCookieFromInject(res)).toBeNull();

      const after = await pool.query<{ count: string }>(
        `select count(*)::text from users where email = $1`,
        ["dup@example.com"],
      );
      expect(Number(after.rows[0].count)).toBe(1);
    });

    it("rejects too-short password with 400", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/sign-up/email",
        headers: { "content-type": "application/json" },
        payload: {
          email: "weak@example.com",
          password: "short",
          name: "Weak",
        },
      });

      expect(res.statusCode).toBe(400);
      const blob = JSON.stringify(res.json()).toLowerCase();
      expect(blob).toContain("password");
    });
  });

  describe("POST /api/auth/sign-in/email", () => {
    it("returns token + user for correct password", async () => {
      await createTestUser({
        email: "bob@example.com",
        password: "test-password-12345",
        name: "Bob",
      });

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/sign-in/email",
        headers: { "content-type": "application/json" },
        payload: {
          email: "bob@example.com",
          password: "test-password-12345",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        token: string;
        user: { id: string; email: string };
      };
      expect(body.token).toBeTruthy();
      expect(body.user.email).toBe("bob@example.com");
      expect(sessionCookieFromInject(res)).toBeTruthy();
    });

    it("rejects wrong password with 401", async () => {
      await createTestUser({
        email: "carol@example.com",
        password: "test-password-12345",
      });

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/sign-in/email",
        headers: { "content-type": "application/json" },
        payload: {
          email: "carol@example.com",
          password: "wrong-password-99999",
        },
      });

      expect(res.statusCode).toBe(401);
      const blob = JSON.stringify(res.json()).toLowerCase();
      expect(blob).toContain("invalid");
    });
  });

  describe("POST /api/auth/sign-out", () => {
    it("returns success and deletes session row from DB", async () => {
      const user = await createTestUser({ email: "dave@example.com" });

      const before = await pool.query<{ count: string }>(
        `select count(*)::text from session where "userId" = $1`,
        [user.userId],
      );
      expect(Number(before.rows[0].count)).toBe(1);

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/sign-out",
        headers: { ...user.headers, "content-type": "application/json" },
        payload: {},
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ success: true });

      const after = await pool.query<{ count: string }>(
        `select count(*)::text from session where "userId" = $1`,
        [user.userId],
      );
      expect(Number(after.rows[0].count)).toBe(0);
    });
  });

  describe("GET /api/auth/get-session", () => {
    it("returns user + session for a valid session cookie", async () => {
      const user = await createTestUser({ email: "eve@example.com" });

      const res = await app.inject({
        method: "GET",
        url: "/api/auth/get-session",
        headers: user.headers,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        user: { id: string; email: string };
        session: { userId: string; token: string };
      };
      expect(body.user.id).toBe(user.userId);
      expect(body.user.email).toBe("eve@example.com");
      expect(body.session.userId).toBe(user.userId);
    });
  });

  // Closes acceptance gap from sec 1.8: explicit assertion that signIn
  // exposes no observable difference between "this email is not registered"
  // and "this email is registered, but the password is wrong". Both must
  // collapse to the same 401 + body shape; otherwise an unauthenticated
  // caller could probe which emails exist by diffing responses.
  describe("email enumeration prevention", () => {
    it("returns identical 401 shape for non-existent email vs wrong password on verified user", async () => {
      await createTestUser({
        email: "registered@example.com",
        password: "test-password-12345",
      });

      const wrongPassword = await app.inject({
        method: "POST",
        url: "/api/auth/sign-in/email",
        headers: { "content-type": "application/json" },
        payload: {
          email: "registered@example.com",
          password: "wrong-password-99999",
        },
      });

      const unknownEmail = await app.inject({
        method: "POST",
        url: "/api/auth/sign-in/email",
        headers: { "content-type": "application/json" },
        payload: {
          email: "never-registered@example.com",
          password: "any-password-12345",
        },
      });

      expect(wrongPassword.statusCode).toBe(401);
      expect(unknownEmail.statusCode).toBe(401);

      const wrongBody = wrongPassword.json() as Record<string, unknown>;
      const unknownBody = unknownEmail.json() as Record<string, unknown>;

      expect(Object.keys(wrongBody).sort()).toEqual(
        Object.keys(unknownBody).sort(),
      );
      if ("code" in wrongBody || "code" in unknownBody) {
        expect(wrongBody.code).toBe(unknownBody.code);
      }
      if ("message" in wrongBody || "message" in unknownBody) {
        expect(wrongBody.message).toBe(unknownBody.message);
      }
    });
  });

  // Closes acceptance gap from sec 1.8: opaque-session model invariant. Since
  // session cookies resolve to a `session` row on every authed request, deleting
  // that row instantly invalidates every device holding the cookie — the runtime
  // equivalent of a JWT revocation. Smoke: the cookie works against a protected
  // route, DELETE FROM session, the same cookie is rejected with 401.
  //
  // The probe route is GET /api/balance: requireUser-gated and 200 for any live
  // user (the welcome grant creates the wallet). It used to be /api/backup/stats,
  // which does not exist — so this test asserted 200 on a 404 and had been red
  // long before the cookie migration.
  describe("session revocation", () => {
    it("DELETE FROM session → next request with the same cookie is rejected with 401", async () => {
      const user = await createTestUser({ email: "revoke@example.com" });

      const before = await app.inject({
        method: "GET",
        url: "/api/balance",
        headers: user.headers,
      });
      expect(before.statusCode).toBe(200);

      const result = await pool.query(
        `delete from session where "userId" = $1`,
        [user.userId],
      );
      expect(result.rowCount).toBe(1);

      const after = await app.inject({
        method: "GET",
        url: "/api/balance",
        headers: user.headers,
      });
      expect(after.statusCode).toBe(401);
    });
  });
});
