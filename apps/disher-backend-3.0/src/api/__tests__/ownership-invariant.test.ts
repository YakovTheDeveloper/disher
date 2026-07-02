import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createTestUser, type TestUser } from "../../test/auth-helpers.js";
import { makeTestPool, truncateAllUserData } from "../../test/db-helpers.js";

// Two invariants per protected route:
//   1. No bearer → 401 (verifyUser blocks before any handler logic).
//   2. Cross-user isolation: data created/seeded under userA is invisible
//      to userB.

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

let app: FastifyInstance;
let pool: ReturnType<typeof makeTestPool>;

const PROTECTED_ROUTES = [
  { method: "PUT" as const, url: "/api/backup", body: {} },
  { method: "GET" as const, url: "/api/backup" },
];

beforeAll(async () => {
  if (!ready) return;
  const { backupRoutes } = await import("../routes/backup.js");
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

describeIfReady("protected routes — ownership invariant", () => {
  beforeEach(async () => {
    await truncateAllUserData(pool);
  });

  describe("no bearer token → 401", () => {
    it.each(PROTECTED_ROUTES)(
      "$method $url rejects unauthenticated request",
      async (route: (typeof PROTECTED_ROUTES)[number]) => {
        const { method, url } = route;
        const body = "body" in route ? route.body : undefined;
        const res = await app.inject({
          method,
          url,
          payload: body as never,
        });
        expect(res.statusCode, `${method} ${url}: ${res.body}`).toBe(401);
      },
    );
  });

  describe("cross-user isolation", () => {
    let userA: TestUser;
    let userB: TestUser;

    beforeEach(async () => {
      userA = await createTestUser();
      userB = await createTestUser();
    });

    it("/api/backup — userB cannot read userA's vault", async () => {
      const blob = { secret: "userA's data" };
      await app.inject({
        method: "PUT",
        url: "/api/backup",
        headers: userA.headers,
        payload: blob,
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/backup",
        headers: userB.headers,
      });
      expect(res.statusCode).toBe(404);
    });
  });
});

if (!ready) {
  describe("protected routes — ownership invariant", () => {
    it.skip(
      "TEST_DATABASE_URL not set — see .env in apps/disher-backend-3.0",
      () => {},
    );
  });
}
