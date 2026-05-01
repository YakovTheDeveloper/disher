import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp, type BuiltApp } from "../buildApp.js";

// B3.0 smoke: better-auth handler is mounted at /api/auth/*.
// Verifies that the route exists (NOT 404) and returns better-auth's
// "no session" contract for an unauthenticated GET. Real signup/signin
// flows are covered in B3.1.

describe("better-auth HTTP mount", () => {
  let app: BuiltApp;

  beforeAll(async () => {
    process.env.BETTER_AUTH_SECRET ??= "a".repeat(64);
    app = await buildApp({ logger: false, https: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/auth/get-session is mounted (not 404)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/get-session",
    });
    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).toBeLessThan(500);
  });

  it("GET /api/auth/get-session without bearer returns null session", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/get-session",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body?.user ?? null).toBeNull();
  });
});
