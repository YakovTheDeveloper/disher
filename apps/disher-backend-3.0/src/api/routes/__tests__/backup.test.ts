import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestUser, type TestUser } from "../../../test/auth-helpers.js";
import { makeTestPool, truncateAllUserData } from "../../../test/db-helpers.js";

// Backup endpoint contract:
//   PUT    /api/backup   body: arbitrary jsonb — last write wins
//   GET    /api/backup   → snapshot, or 404
//   DELETE /api/backup   erase the user's vault (consent withdrawn) — idempotent 204
//
// The server has no schema for user data. The body round-trips verbatim.

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

let app: FastifyInstance;
let pool: ReturnType<typeof makeTestPool>;

beforeAll(async () => {
  if (!ready) return;
  const { backupRoutes } = await import("../backup.js");
  app = Fastify({ logger: false });
  await app.register(backupRoutes, { prefix: "/api/backup" });
  await app.ready();
  pool = makeTestPool();
});

afterAll(async () => {
  if (!ready) return;
  await app?.close();
  await pool?.end();
});

describeIfReady("PUT/GET /api/backup", () => {
  let user: TestUser;

  beforeEach(async () => {
    await truncateAllUserData(pool);
    user = await createTestUser();
  });

  it("GET on empty vault returns 404", async () => {
    const r = await app.inject({
      method: "GET",
      url: "/api/backup",
      headers: user.headers,
    });
    expect(r.statusCode).toBe(404);
  });

  it("PUT then GET round-trips an arbitrary blob", async () => {
    const blob = {
      products: [{ id: "p1", name: "tofu" }],
      schedule_foods: [{ id: "sf1", date: "01-01-2099" }],
    };
    const put = await app.inject({
      method: "PUT",
      url: "/api/backup",
      headers: user.headers,
      payload: blob,
    });
    expect(put.statusCode).toBe(204);

    const get = await app.inject({
      method: "GET",
      url: "/api/backup",
      headers: user.headers,
    });
    expect(get.statusCode).toBe(200);
    expect(get.json()).toEqual(blob);
  });

  it("PUT is last-write-wins", async () => {
    await app.inject({
      method: "PUT",
      url: "/api/backup",
      headers: user.headers,
      payload: { v: 1 },
    });
    await app.inject({
      method: "PUT",
      url: "/api/backup",
      headers: user.headers,
      payload: { v: 2 },
    });
    const get = await app.inject({
      method: "GET",
      url: "/api/backup",
      headers: user.headers,
    });
    expect(get.json()).toEqual({ v: 2 });
  });

  it("cross-user isolation: userB cannot read userA's snapshot", async () => {
    const userB = await createTestUser();
    await app.inject({
      method: "PUT",
      url: "/api/backup",
      headers: user.headers,
      payload: { secret: "userA's data" },
    });

    const r = await app.inject({
      method: "GET",
      url: "/api/backup",
      headers: userB.headers,
    });
    expect(r.statusCode).toBe(404);
  });

  it("missing bearer → 401", async () => {
    const r = await app.inject({
      method: "GET",
      url: "/api/backup",
    });
    expect(r.statusCode).toBe(401);
  });

  it("DELETE on empty vault is idempotent → 204", async () => {
    const r = await app.inject({
      method: "DELETE",
      url: "/api/backup",
      headers: user.headers,
    });
    expect(r.statusCode).toBe(204);
  });

  it("PUT then DELETE then GET → 404 (vault erased)", async () => {
    await app.inject({
      method: "PUT",
      url: "/api/backup",
      headers: user.headers,
      payload: { products: [{ id: "p1", name: "tofu" }] },
    });

    const del = await app.inject({
      method: "DELETE",
      url: "/api/backup",
      headers: user.headers,
    });
    expect(del.statusCode).toBe(204);

    const get = await app.inject({
      method: "GET",
      url: "/api/backup",
      headers: user.headers,
    });
    expect(get.statusCode).toBe(404);
  });

  it("DELETE without bearer → 401", async () => {
    const r = await app.inject({
      method: "DELETE",
      url: "/api/backup",
    });
    expect(r.statusCode).toBe(401);
  });

  it("cross-user isolation: userB's DELETE can't erase userA's vault", async () => {
    const userB = await createTestUser();
    await app.inject({
      method: "PUT",
      url: "/api/backup",
      headers: user.headers,
      payload: { secret: "userA's data" },
    });

    const del = await app.inject({
      method: "DELETE",
      url: "/api/backup",
      headers: userB.headers,
    });
    expect(del.statusCode).toBe(204);

    // userA's row survives userB's delete.
    const get = await app.inject({
      method: "GET",
      url: "/api/backup",
      headers: user.headers,
    });
    expect(get.statusCode).toBe(200);
    expect(get.json()).toEqual({ secret: "userA's data" });
  });
});
