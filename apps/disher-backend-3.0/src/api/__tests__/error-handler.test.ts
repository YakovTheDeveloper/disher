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
});
