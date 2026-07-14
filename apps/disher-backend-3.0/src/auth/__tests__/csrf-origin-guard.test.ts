import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildApp, type BuiltApp } from "../../api/buildApp.js";
import { createTestUser } from "../../test/auth-helpers.js";
import { makeTestPool, truncateAllUserData } from "../../test/db-helpers.js";

// Ratchet on requireTrustedOrigin — the INTENTIONAL CSRF layer for every
// mutating route outside /api/auth/* (better-auth guards its own routes and
// nothing else). Before it, three accidents covered them — SameSite=Lax, the
// CORS preflight, the JSON content type — none of which is a primary defence and
// any of which a future edit could lift without noticing. These tests fail if
// that happens.
//
// PUT /api/backup is the sharpest instance: it overwrites the user's entire food
// diary from the request body.

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

describeIfReady("requireTrustedOrigin", () => {
  let app: BuiltApp;
  let pool: ReturnType<typeof makeTestPool>;
  let cookie: string;

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
    cookie = (await createTestUser()).sessionCookie;
  });

  const snapshot = { products: [], dishes: [] };

  it("rejects a mutating request from an untrusted origin", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/api/backup",
      headers: {
        cookie,
        origin: "https://evil.example",
        "content-type": "application/json",
      },
      payload: snapshot,
    });

    expect(res.statusCode).toBe(403);
  });

  // A browser ALWAYS sends Origin on a state-changing request. An absent one is
  // either a non-browser client (the SPA is our only caller) or an attacker
  // betting we fail open — OWASP CSRF CS: "we recommend blocking".
  it("rejects a mutating request with no Origin header at all", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/api/backup",
      headers: { cookie, "content-type": "application/json" },
      payload: snapshot,
    });

    expect(res.statusCode).toBe(403);
  });

  it("lets a trusted origin through to the handler", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/api/backup",
      headers: {
        cookie,
        origin: "http://localhost:5173",
        "content-type": "application/json",
      },
      payload: snapshot,
    });

    expect(res.statusCode).not.toBe(403);
  });

  // Safe methods are exempt: they change nothing, and blocking them would break
  // same-origin GETs (which carry no Origin) for no gain.
  it("does not block a GET with no Origin", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/backup",
      headers: { cookie },
    });

    expect(res.statusCode).not.toBe(403);
  });

  // Guarding is worthless if the browser was going to be allowed to make the
  // call anyway. Dev used to reflect ANY origin with credentials:true — harmless
  // with a bearer in localStorage, a diary-exfiltration hole with a session
  // cookie. CORS and the guard now read the SAME allowlist (auth/origins.ts).
  // PUT /api/backup alone proved nothing about the other five scopes: the route
  // modules' own tests build a bare Fastify and never touch buildApp, so the hook
  // could be dropped from /api/admin or /api/analyze and every board would stay
  // green. This table is the ratchet — one row per mutating route we mounted the
  // guard on.
  //
  // `payload` matters: Fastify validates the route schema at preValidation, which
  // runs BEFORE preHandler — so on a schema-carrying route (user-reports) a body
  // that fails validation 400s before the guard is ever reached. The request is
  // still refused, but to prove the GUARD refuses it we must send a body the schema
  // accepts and let the 403 come from where we claim it comes from.
  const MUTATING_ROUTES: Array<{
    method: "POST" | "PUT" | "DELETE";
    url: string;
    payload?: unknown;
  }> = [
    { method: "PUT", url: "/api/backup" },
    { method: "DELETE", url: "/api/backup" },
    { method: "POST", url: "/api/user-reports", payload: { text: "csrf probe" } },
    { method: "POST", url: "/api/analyze" },
    { method: "DELETE", url: "/api/analyses/00000000-0000-0000-0000-000000000000" },
    { method: "POST", url: "/api/analyze-dish" },
    { method: "POST", url: "/api/suggestions/dish-products" },
    { method: "POST", url: "/api/suggestions/product-nutrients" },
    { method: "POST", url: "/api/free-text-food/parse" },
    { method: "POST", url: "/api/admin/users/00000000-0000-0000-0000-000000000000/topup" },
  ];

  it.each(MUTATING_ROUTES)(
    "guards $method $url against an untrusted origin",
    async ({ method, url, payload }) => {
      const res = await app.inject({
        method,
        url,
        headers: {
          cookie,
          origin: "https://evil.example",
          "content-type": "application/json",
        },
        payload: payload ?? {},
      });

      expect(res.statusCode).toBe(403);
    },
  );

  it.each(MUTATING_ROUTES)(
    "guards $method $url against a missing origin",
    async ({ method, url, payload }) => {
      const res = await app.inject({
        method,
        url,
        headers: { cookie, "content-type": "application/json" },
        payload: payload ?? {},
      });

      expect(res.statusCode).toBe(403);
    },
  );

  it("does not grant CORS to an untrusted origin", async () => {
    const res = await app.inject({
      method: "OPTIONS",
      url: "/api/backup",
      headers: {
        origin: "https://evil.example",
        "access-control-request-method": "PUT",
      },
    });

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("grants CORS with credentials to a dev origin", async () => {
    const res = await app.inject({
      method: "OPTIONS",
      url: "/api/backup",
      headers: {
        origin: "http://192.168.1.50:5173",
        "access-control-request-method": "PUT",
      },
    });

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://192.168.1.50:5173",
    );
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });
});
