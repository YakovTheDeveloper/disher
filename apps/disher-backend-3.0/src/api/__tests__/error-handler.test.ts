import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { BuiltApp } from "../buildApp.js";

// Verifies the global problem+json contract wired in buildApp: the notFound +
// error handlers render the RFC 9457-subset shape, echo the request id, and a
// 5xx never serializes a stack to the client. Uses app.inject() — no real DB,
// no better-auth session, no network.
describe("global problem+json error handler", () => {
  let app: BuiltApp;

  beforeAll(async () => {
    process.env.BETTER_AUTH_SECRET ??= "a".repeat(64);
    const { buildApp } = await import("../buildApp.js");
    app = await buildApp({ logger: false, https: false });
    // A route that throws — added before the first inject() triggers ready().
    app.get("/__boom", async () => {
      throw new Error("boom with SECRET internal detail");
    });
    // A schema'd route, so the validation branch is exercised through the real
    // Ajv → setErrorHandler path rather than a hand-built error object.
    app.post(
      "/__validated",
      {
        schema: {
          body: {
            type: "object",
            required: ["text"],
            additionalProperties: false,
            properties: { text: { type: "string" }, count: { type: "integer" } },
          },
        },
      },
      async () => ({ ok: true }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it("unknown route → 404 problem+json with code/status/title/instance + X-Request-Id", async () => {
    const res = await app.inject({ method: "GET", url: "/api/does-not-exist" });
    expect(res.statusCode).toBe(404);
    expect(res.headers["content-type"]).toContain("application/problem+json");
    expect(res.headers["x-request-id"]).toBeTruthy();

    const body = res.json();
    expect(body.code).toBe("not_found");
    expect(body.status).toBe(404);
    expect(typeof body.title).toBe("string");
    expect(body.instance).toBeTruthy();
  });

  it("echoes a client-sent X-Request-Id as the instance", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/nope",
      headers: { "x-request-id": "req-12345" },
    });
    expect(res.json().instance).toBe("req-12345");
    expect(res.headers["x-request-id"]).toBe("req-12345");
  });

  it("a missing required field → 400 problem+json keyed on that field", async () => {
    const res = await app.inject({ method: "POST", url: "/__validated", payload: {} });
    // 400, not 422 — see the validation branch in toProblem.
    expect(res.statusCode).toBe(400);
    expect(res.headers["content-type"]).toContain("application/problem+json");

    const body = res.json();
    expect(body.code).toBe("bad_request");
    expect(body.status).toBe(400);
    expect(body.instance).toBeTruthy();
    // `required` names the member in params, not instancePath — the key must
    // still come out as the bare field name, not "(root)".
    expect(body.fieldErrors).toEqual({ text: expect.stringContaining("required") });
    expect(body.detail).toContain("body");
  });

  it("a wrong-typed field → 400 keyed on its instancePath", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/__validated",
      payload: { text: "hi", count: "not-a-number" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().fieldErrors).toEqual({ count: expect.stringMatching(/integer/i) });
  });

  it("a NUMERIC string for an integer → 400, not a coerced number", async () => {
    // The ratchet on `coerceTypes: false` (api/ajv-options.ts), and the reason it
    // has to be a numeric string rather than "not-a-number": Fastify's Ajv default
    // (`coerceTypes: 'array'`) would REWRITE "500" to 500 before the handler ever
    // saw it. This is not a style point — POST /api/admin/users/:id/topup takes an
    // integer `amountKop`, so under the default a caller sending "500" would move
    // real money on a route that answers 400 today. The admin matrix cannot be the
    // only guard: it needs TEST_DATABASE_URL and skips without one.
    const res = await app.inject({
      method: "POST",
      url: "/__validated",
      payload: { text: "hi", count: "500" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().fieldErrors).toEqual({ count: expect.stringMatching(/integer/i) });
  });

  it("an extra property is STRIPPED, not rejected (Fastify's removeAdditional)", async () => {
    // Pinning the surprise: `additionalProperties: false` under Fastify's
    // default Ajv does not 400 — it silently drops the member. Routes that must
    // refuse an unknown field cannot lean on the schema for it.
    const res = await app.inject({
      method: "POST",
      url: "/__validated",
      payload: { text: "hi", bogus: 1 },
    });
    expect(res.statusCode).toBe(200);
  });

  it("a thrown route → 500 problem+json that never leaks a stack to the client", async () => {
    const res = await app.inject({ method: "GET", url: "/__boom" });
    expect(res.statusCode).toBe(500);
    expect(res.headers["content-type"]).toContain("application/problem+json");

    const body = res.json();
    expect(body.code).toBe("internal_error");
    expect(body.status).toBe(500);
    expect(body.instance).toBeTruthy();
    // The body must never carry a serialized stack, in any env.
    const serialized = JSON.stringify(body);
    expect(serialized).not.toMatch(/"stack"/);
    expect(serialized).not.toMatch(/\bat \w+.*:\d+:\d+/); // stack-frame shape
  });

  it("an anonymous caller with a malformed body → 401, never a 400 quoting our schema", async () => {
    // The ratchet on requireUser's hook phase. Fastify runs schema validation
    // BETWEEN onRequest and preHandler, so a guard left on preHandler sits behind
    // Ajv: a caller with no session and a bad body would be told which field is
    // wrong — a free readout of the private shape — instead of being refused, and
    // would have had its body parsed (up to bodyLimit, 5MB) first.
    //
    // A real route, not a synthetic one: the phase is a property of how buildApp
    // wires the scope, which a hand-registered route would not exercise. Origin is
    // trusted here on purpose, so requireTrustedOrigin passes and requireUser is
    // the guard under test; `text: 123` violates the route's schema.
    const res = await app.inject({
      method: "POST",
      url: "/api/user-reports/",
      headers: { origin: "http://localhost:5173" },
      payload: { text: 123 },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().fieldErrors).toBeUndefined();
  });
});
