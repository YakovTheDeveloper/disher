import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import {
  createTestUser,
  type TestUser,
} from "../../../test/auth-helpers.js";
import {
  makeTestPool,
  truncateAllUserData,
} from "../../../test/db-helpers.js";

// /api/backup integration tests (B2.2 — own-auth rewrite).
//
// Replaces the legacy mock that forwarded `x-test-user-id` headers to the
// handler. Now exercises the FULL stack:
//   bearer token (created via better-auth signUpEmail)
//     → verifyUserBearer (auth.api.getSession)
//     → backupRoutes handler
//     → pg.Pool against TEST_DATABASE_URL (disher_test).
//
// The `vi.mock("../../auth.js")` is at the import boundary, not the behavior
// boundary: the mocked verifyUser IS the real better-auth verifier
// (verify-bearer.ts). When B4 makes auth.ts itself use verify-bearer, the
// mock disappears with one line edit.
//
// truncateAllUserData in beforeEach replaces the manual cleanup tracker.

vi.mock("../../auth.js", async () => {
  const { verifyUserBearer } = await import("../../../auth/verify-bearer.js");
  return { verifyUser: verifyUserBearer };
});

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

let app: FastifyInstance;
let pool: ReturnType<typeof makeTestPool>;

function payloadFor(
  table: string,
  userId: string,
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const base: Record<string, unknown> = {
    table,
    id,
    user_id: userId,
    edit_count: 1,
    client_modified_at: now,
    created_at: now,
    deleted_at: null,
  };
  switch (table) {
    case "products":
      return {
        ...base,
        name: `_test_${id.slice(0, 8)}`,
        nutrients: {},
        portions: [],
        categories: [],
        ...overrides,
      };
    case "dishes":
      return { ...base, name: `_test_dish_${id.slice(0, 8)}`, ...overrides };
    case "dish_items":
      return { ...base, quantity: 100, ...overrides };
    case "dish_portions":
      return {
        ...base,
        label: "porcia",
        amount: 1,
        unit: "g",
        grams: 100,
        ...overrides,
      };
    case "schedule_foods":
      return {
        ...base,
        date: "01-01-2099",
        time: "10:00",
        type: "food",
        quantity: 100,
        details: "",
        ...overrides,
      };
    case "schedule_events":
      return {
        ...base,
        date: "01-01-2099",
        time: "10:00",
        end_time: "",
        text: "_test_event",
        atoms: [],
        ...overrides,
      };
    case "daily_norms":
      return {
        ...base,
        name: "_test_norm",
        description: "",
        items: {},
        ...overrides,
      };
    case "periods":
      return {
        ...base,
        name: "_test_period",
        color_index: 0,
        font_family: "sans",
        font_size: 16,
        ...overrides,
      };
    default:
      throw new Error(`unknown table: ${table}`);
  }
}

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

describeIfReady("/api/backup integration", () => {
  let user: TestUser;

  beforeEach(async () => {
    await truncateAllUserData(pool);
    user = await createTestUser();
  });

  describe("happy path: each table accepts a single row", () => {
    it.each([
      "products",
      "dishes",
      "schedule_events",
      "daily_norms",
      "periods",
    ])("accepts a fresh %s row", async (table) => {
      const row = payloadFor(table, user.userId);
      const res = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: user.headers,
        payload: { rows: [row] },
      });
      expect(res.statusCode, `${table}: ${res.body}`).toBe(200);
      const body = res.json() as {
        accepted: Array<{ id: string; table: string }>;
        rejected: Array<{ id: string; reason: string; table: string }>;
      };
      expect(body.rejected).toEqual([]);
      expect(body.accepted).toHaveLength(1);
      expect(body.accepted[0]).toMatchObject({ id: row.id, table });
    });

    it("accepts a dish + dish_items + dish_portions chain", async () => {
      const product = payloadFor("products", user.userId);
      const dish = payloadFor("dishes", user.userId);
      const dishItem = payloadFor("dish_items", user.userId, {
        dish_id: dish.id,
        product_id: product.id,
        quantity: 50,
      });
      const dishPortion = payloadFor("dish_portions", user.userId, {
        dish_id: dish.id,
        label: "small",
        amount: 1,
        unit: "g",
        grams: 50,
      });
      const res = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: user.headers,
        payload: { rows: [product, dish, dishItem, dishPortion] },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        accepted: Array<{ id: string }>;
        rejected: unknown[];
      };
      expect(body.rejected).toEqual([]);
      const acceptedIds = new Set(body.accepted.map((a) => a.id));
      expect(acceptedIds.has(product.id as string)).toBe(true);
      expect(acceptedIds.has(dish.id as string)).toBe(true);
      expect(acceptedIds.has(dishItem.id as string)).toBe(true);
      expect(acceptedIds.has(dishPortion.id as string)).toBe(true);
    });

    it("accepts a schedule_food referencing the product", async () => {
      const product = payloadFor("products", user.userId);
      const sched = payloadFor("schedule_foods", user.userId, {
        product_id: product.id,
        type: "food",
      });
      const res = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: user.headers,
        payload: { rows: [product, sched] },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        accepted: Array<{ id: string }>;
        rejected: unknown[];
      };
      expect(body.rejected).toEqual([]);
      expect(body.accepted.map((a) => a.id)).toContain(sched.id);
    });
  });

  describe("auth + LWW edge cases", () => {
    it("rejects requests without a bearer token (401)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/backup",
        payload: { rows: [] },
      });
      expect(res.statusCode).toBe(401);
    });

    it("rejects rows with user_id != jwt sub (user_id_mismatch)", async () => {
      // Create a second user — the row will spoof their userId. Backend must
      // reject because authenticated user (jwt sub) != row.user_id.
      const otherUser = await createTestUser();
      const row = payloadFor("products", otherUser.userId);
      const res = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: user.headers, // authenticated as `user`, NOT otherUser
        payload: { rows: [row] },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        accepted: unknown[];
        rejected: Array<{ id: string; reason: string }>;
      };
      expect(body.accepted).toEqual([]);
      expect(body.rejected).toHaveLength(1);
      expect(body.rejected[0]).toMatchObject({
        id: row.id,
        reason: "user_id_mismatch",
      });
    });

    it("rejects stale edit_count (lower or equal-with-older-time)", async () => {
      // Insert v2 first, then attempt v1 — v1 must be rejected as stale.
      const v2 = payloadFor("products", user.userId, {
        edit_count: 2,
        client_modified_at: new Date().toISOString(),
      });
      const fresh = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: user.headers,
        payload: { rows: [v2] },
      });
      expect(fresh.statusCode).toBe(200);
      expect((fresh.json() as { accepted: unknown[] }).accepted).toHaveLength(
        1,
      );

      const v1 = { ...v2, edit_count: 1 };
      const stale = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: user.headers,
        payload: { rows: [v1] },
      });
      expect(stale.statusCode).toBe(200);
      const body = stale.json() as {
        accepted: unknown[];
        rejected: Array<{ id: string; reason: string; server_state: unknown }>;
      };
      expect(body.accepted).toEqual([]);
      expect(body.rejected).toHaveLength(1);
      expect(body.rejected[0]).toMatchObject({
        id: v2.id,
        reason: "stale_edit_count",
      });
      expect(body.rejected[0].server_state).toBeTruthy();
    });

    it("idempotent: same row twice → second is accepted no-op (>= tie-break)", async () => {
      const row = payloadFor("products", user.userId, {
        edit_count: 5,
        client_modified_at: new Date().toISOString(),
      });
      const a = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: user.headers,
        payload: { rows: [row] },
      });
      const b = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: user.headers,
        payload: { rows: [row] },
      });
      expect(a.statusCode).toBe(200);
      expect(b.statusCode).toBe(200);
      expect(
        (b.json() as { accepted: Array<{ id: string }> }).accepted.map(
          (x) => x.id,
        ),
      ).toContain(row.id);
    });

    it("soft-delete is sticky: insert after delete leaves row deleted", async () => {
      const row = payloadFor("products", user.userId);
      // 1. Create.
      await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: user.headers,
        payload: { rows: [row] },
      });
      // 2. Delete (set deleted_at, bump edit_count).
      const deleteRow = {
        ...row,
        edit_count: 2,
        client_modified_at: new Date(Date.now() + 1000).toISOString(),
        deleted_at: new Date().toISOString(),
      };
      const delRes = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: user.headers,
        payload: { rows: [deleteRow] },
      });
      expect(delRes.statusCode).toBe(200);

      // 3. Try to "resurrect" with re-insert; backend WHERE clause keeps it deleted.
      const resurrect = {
        ...row,
        edit_count: 99,
        client_modified_at: new Date(Date.now() + 2000).toISOString(),
        deleted_at: null,
      };
      const resRes = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: user.headers,
        payload: { rows: [resurrect] },
      });
      expect(resRes.statusCode).toBe(200);

      const { rows: dbRows } = await pool.query<{ deleted_at: Date | null }>(
        "select deleted_at from public.products where id = $1::uuid",
        [row.id],
      );
      expect(dbRows).toHaveLength(1);
      expect(
        dbRows[0].deleted_at,
        "soft-delete should be sticky — resurrect must NOT clear deleted_at",
      ).not.toBeNull();
    });
  });
});

if (!ready) {
  describe("/api/backup integration", () => {
    it.skip(
      "TEST_DATABASE_URL not set — see .env in apps/disher-backend-3.0",
      () => {},
    );
  });
}
