import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import {
  createTestUser,
  type TestUser,
} from "../../test/auth-helpers.js";
import {
  makeTestPool,
  truncateAllUserData,
} from "../../test/db-helpers.js";

// B4-backlog: parameterised ownership invariant across ALL protected routes.
//
// Two invariants per route:
//   1. No bearer → 401 (verifyUser blocks before any handler logic).
//   2. Cross-user isolation: data created/seeded under userA is invisible
//      to userB. For backup/* this means snapshot/stats return only the
//      authed user's rows. For analytics/* the cache key (userId, date, tab)
//      means userB's lookup misses → 404.
//
// We do NOT re-test backup push user_id_mismatch — that lives in
// backup.test.ts and exercises the row-level mismatch shape (200 + rejected).

process.env.ANALYTICS_DB_PATH = ":memory:";

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

let app: FastifyInstance;
let pool: ReturnType<typeof makeTestPool>;

const PROTECTED_ROUTES = [
  { method: "POST" as const, url: "/api/backup", body: { rows: [] } },
  { method: "GET" as const, url: "/api/backup/snapshot" },
  { method: "GET" as const, url: "/api/backup/stats" },
  { method: "GET" as const, url: "/api/analytics/v2/daily/01-01-2099" },
  {
    method: "POST" as const,
    url: "/api/analytics/v2/daily/01-01-2099",
    body: { tab: "food", foods: [], inputHash: "x" },
  },
  { method: "GET" as const, url: "/api/analytics/v2/weekly/01-01-2099" },
  {
    method: "POST" as const,
    url: "/api/analytics/v2/weekly/01-01-2099",
    body: { dates: ["01-01-2099"] },
  },
];

beforeAll(async () => {
  if (!ready) return;
  const { backupRoutes } = await import("../routes/backup.js");
  const { analyticsRoutes } = await import("../routes/analytics.js");
  const { initAnalyticsDb } = await import("../analytics-db.js");
  initAnalyticsDb();
  app = Fastify({ logger: false });
  await app.register(backupRoutes, { prefix: "/api/backup" });
  await app.register(analyticsRoutes, { prefix: "/api/analytics" });
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
      async ({ method, url, body }) => {
        const res = await app.inject({
          method,
          url,
          payload: body,
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

    it("/api/backup/snapshot — userB sees no rows from userA", async () => {
      const now = new Date().toISOString();
      const productA = {
        table: "products",
        id: crypto.randomUUID(),
        user_id: userA.userId,
        edit_count: 1,
        client_modified_at: now,
        created_at: now,
        deleted_at: null,
        name: `_test_iso_${Date.now()}`,
        nutrients: {},
        portions: [],
        categories: [],
      };
      const seed = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: userA.headers,
        payload: { rows: [productA] },
      });
      expect(seed.statusCode).toBe(200);

      const snap = await app.inject({
        method: "GET",
        url: "/api/backup/snapshot",
        headers: userB.headers,
      });
      expect(snap.statusCode).toBe(200);
      const body = snap.json() as Record<string, unknown[]>;
      // products is the only table that may legitimately return rows
      // (global_catalog where user_id IS NULL). User-owned rows must not leak.
      const userOwnedProducts = (body.products ?? []).filter(
        (r) => (r as { user_id: string | null }).user_id === userA.userId,
      );
      expect(userOwnedProducts).toHaveLength(0);
      // All other tables are strictly user-scoped.
      for (const table of [
        "dishes",
        "schedule_foods",
        "schedule_events",
        "daily_norms",
        "periods",
      ]) {
        expect(body[table] ?? []).toEqual([]);
      }
    });

    it("/api/backup/stats — userB counts are zero for userA's data", async () => {
      const now = new Date().toISOString();
      const seed = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: userA.headers,
        payload: {
          rows: [
            {
              table: "products",
              id: crypto.randomUUID(),
              user_id: userA.userId,
              edit_count: 1,
              client_modified_at: now,
              created_at: now,
              deleted_at: null,
              name: `_test_iso_p1_${Date.now()}`,
              nutrients: {},
              portions: [],
              categories: [],
            },
            {
              table: "dishes",
              id: crypto.randomUUID(),
              user_id: userA.userId,
              edit_count: 1,
              client_modified_at: now,
              created_at: now,
              deleted_at: null,
              name: `_test_iso_d1_${Date.now()}`,
            },
          ],
        },
      });
      expect(seed.statusCode).toBe(200);

      const stats = await app.inject({
        method: "GET",
        url: "/api/backup/stats",
        headers: userB.headers,
      });
      expect(stats.statusCode).toBe(200);
      const body = stats.json() as Record<string, number>;
      // user-scoped counts only — userA's rows must not be counted for userB.
      expect(body.dishes).toBe(0);
      // products count excludes global_catalog (handler filters user_id = $1 only).
      expect(body.products).toBe(0);
    });

    it("/api/analytics/v2/daily/:date — userB cache miss → 404", async () => {
      const { upsertDailyAnalysis } = await import("../analytics-db.js");
      upsertDailyAnalysis(
        userA.userId,
        "01-01-2099",
        "food",
        "userA's analysis",
        "hashA",
        "test-model",
      );

      const res = await app.inject({
        method: "GET",
        url: "/api/analytics/v2/daily/01-01-2099?tab=food",
        headers: userB.headers,
      });
      expect(res.statusCode).toBe(404);
    });

    it("/api/analytics/v2/weekly/:weekStart — userB cache miss → 404", async () => {
      const { upsertWeeklyAnalysis } = await import("../analytics-db.js");
      upsertWeeklyAnalysis(
        userA.userId,
        "01-01-2099",
        "userA's weekly",
        ["hashA"],
        "test-model",
      );

      const res = await app.inject({
        method: "GET",
        url: "/api/analytics/v2/weekly/01-01-2099",
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
