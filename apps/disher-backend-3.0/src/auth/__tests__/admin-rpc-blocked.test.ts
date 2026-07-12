import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";

// The admin() plugin is registered for its session `role` plumbing only — its
// bundled RPC surface (/api/auth/admin/*: impersonate, ban, remove-user,
// set-user-password, …) is out of scope and an explicit anti-goal. The
// betterAuthPlugin proxy fail-closes that subtree. This asserts the block holds
// and does NOT over-block the rest of /api/auth/*. Skips when TEST_DATABASE_URL
// is unset (auth/server.ts needs LOCAL_DATABASE_URL, wired by global-setup).

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

let app: FastifyInstance;

beforeAll(async () => {
  if (!ready) return;
  const { betterAuthPlugin } = await import("../fastify-plugin.js");
  app = Fastify({ logger: false });
  await app.register(betterAuthPlugin);
  await app.ready();
});

afterAll(async () => {
  if (!ready) return;
  await app?.close();
});

describeIfReady("better-auth admin RPC surface is fail-closed", () => {
  it("404s the admin RPC subtree (no bearer even needed — blocked before the handler)", async () => {
    for (const url of [
      "/api/auth/admin/list-users",
      "/api/auth/admin/set-role",
      "/api/auth/admin/impersonate-user",
      "/api/auth/admin/remove-user",
      "/api/auth/admin/set-user-password",
    ]) {
      const res = await app.inject({ method: "POST", url });
      expect(res.statusCode, url).toBe(404);
    }
  });

  it("404s the bare /api/auth/admin path too", async () => {
    const res = await app.inject({ method: "GET", url: "/api/auth/admin" });
    expect(res.statusCode).toBe(404);
  });

  it("does NOT over-block the rest of /api/auth/* (get-session passes through)", async () => {
    // No bearer → better-auth answers (200 null-session / 401), but crucially
    // NOT our 404 — proving the guard is scoped to the admin subtree only.
    const res = await app.inject({ method: "GET", url: "/api/auth/get-session" });
    expect(res.statusCode).not.toBe(404);
  });
});
