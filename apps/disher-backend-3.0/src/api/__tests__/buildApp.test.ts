import { describe, it, expect, beforeEach, afterEach } from "vitest";

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
