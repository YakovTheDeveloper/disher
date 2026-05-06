import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from "vitest";
import type { BuiltApp } from "../buildApp.js";

describe("buildApp boot invariants", () => {
  let originalSecret: string | undefined;

  beforeEach(() => {
    originalSecret = process.env.BETTER_AUTH_SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.BETTER_AUTH_SECRET;
    } else {
      process.env.BETTER_AUTH_SECRET = originalSecret;
    }
  });

  it("rejects with a clear error when BETTER_AUTH_SECRET is missing", async () => {
    delete process.env.BETTER_AUTH_SECRET;
    const { buildApp } = await import("../buildApp.js");
    await expect(buildApp({ logger: false, https: false })).rejects.toThrow(
      /BETTER_AUTH_SECRET/
    );
  });

  it("rejects when BETTER_AUTH_SECRET is empty string", async () => {
    process.env.BETTER_AUTH_SECRET = "";
    const { buildApp } = await import("../buildApp.js");
    await expect(buildApp({ logger: false, https: false })).rejects.toThrow(
      /BETTER_AUTH_SECRET/
    );
  });

  it("builds successfully when BETTER_AUTH_SECRET is set", async () => {
    process.env.BETTER_AUTH_SECRET = "a".repeat(64);
    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp({ logger: false, https: false });
    expect(app).toBeDefined();
    expect(typeof app.inject).toBe("function");
    await app.close();
  });
});

// B3.0 smoke: better-auth handler is mounted at /api/auth/*.
// Verifies the route exists (NOT 404) and returns better-auth's "no session"
// contract for an unauthenticated GET. Real signup/signin flows are covered
// in B3.1 / auth-routes.test.ts.
describe("better-auth HTTP mount", () => {
  let app: BuiltApp;

  beforeAll(async () => {
    process.env.BETTER_AUTH_SECRET ??= "a".repeat(64);
    const { buildApp } = await import("../buildApp.js");
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
