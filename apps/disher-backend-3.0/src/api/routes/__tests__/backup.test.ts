import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import pg from "pg";

// 8.3 /api/backup integration smoke (P0).
//
// Registers backupRoutes against a Fastify instance with verifySupabaseUser
// mocked to honor `x-test-user-id` header — auth is OUT OF SCOPE here, see
// 8.10 for that. Hits the live Supabase via the real `pool` (same module
// instance that handlePush uses), inserts test rows under TEST_USER_ID, and
// cleans up every tracked id in afterAll. Idempotent — safe to re-run.
//
// Required env: SUPABASE_DB_URL, SUPABASE_URL, TEST_USER_ID. Without them the
// suite skips with a clear message.

vi.mock("../../supabase-auth.js", () => ({
  verifySupabaseUser: vi.fn(async (req: any, reply: any) => {
    const uid = req.headers["x-test-user-id"];
    if (!uid) {
      reply.status(401).send({ error: "x-test-user-id missing in test" });
      return null;
    }
    return uid;
  }),
}));

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const TEST_USER_ID = process.env.TEST_USER_ID;
const ready = Boolean(SUPABASE_DB_URL && TEST_USER_ID);
const describeIfReady = ready ? describe : describe.skip;

// Track every row id we insert so afterAll can purge.
const inserted: Array<{ table: string; id: string }> = [];
function trackId(table: string, id: string) {
  inserted.push({ table, id });
  return id;
}

// Minimal payloads per table — only required fields. user_id is set per call.
function payloadFor(
  table: string,
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  const id = crypto.randomUUID();
  trackId(table, id);
  const now = new Date().toISOString();
  const base: Record<string, unknown> = {
    table,
    id,
    user_id: TEST_USER_ID,
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
    case "dish_items": {
      // Needs valid dish_id + product_id refs. Caller provides via overrides.
      return { ...base, quantity: 100, ...overrides };
    }
    case "dish_portions":
      return {
        ...base,
        label: "porcia",
        amount: 1,
        unit: "g",
        grams: 100,
        ...overrides,
      };
    case "schedule_foods": {
      // Needs product_id OR dish_id depending on type.
      return {
        ...base,
        date: "01-01-2099",
        time: "10:00",
        type: "food",
        quantity: 100,
        details: "",
        ...overrides,
      };
    }
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

let app: FastifyInstance;
let pool: pg.Pool;

beforeAll(async () => {
  if (!ready) return;
  const { backupRoutes } = await import("../backup.js");
  app = Fastify({ logger: false });
  await app.register(backupRoutes, { prefix: "/api/backup" });
  await app.ready();

  pool = new pg.Pool({
    connectionString: SUPABASE_DB_URL,
    max: 2,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });
});

afterAll(async () => {
  if (!ready) return;
  // Purge in reverse order to satisfy FK constraints (dish_items → dishes etc).
  // Group by table, delete by id list per table.
  const byTable = new Map<string, string[]>();
  for (const { table, id } of inserted) {
    const list = byTable.get(table) ?? [];
    list.push(id);
    byTable.set(table, list);
  }
  // Order matters: dish_items before dishes; schedule_foods before products/dishes.
  const order = [
    "dish_items",
    "dish_portions",
    "schedule_foods",
    "schedule_events",
    "daily_norms",
    "periods",
    "dishes",
    "products",
  ];
  for (const t of order) {
    const ids = byTable.get(t);
    if (!ids?.length) continue;
    await pool.query(`delete from public.${t} where id = any($1::uuid[])`, [
      ids,
    ]);
  }
  await app?.close();
  await pool?.end();
});

describeIfReady("/api/backup integration", () => {
  describe("happy path: each table accepts a single row", () => {
    it.each([
      "products",
      "dishes",
      "schedule_events",
      "daily_norms",
      "periods",
    ])("accepts a fresh %s row", async (table) => {
      // dish_items / dish_portions / schedule_foods need FK refs and live in
      // the chain test below.
      const row = payloadFor(table);
      const res = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: {
          authorization: "Bearer test",
          "x-test-user-id": TEST_USER_ID!,
        },
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
      // Need a real product first to reference from dish_items.
      const product = payloadFor("products");
      const dish = payloadFor("dishes");
      const dishItem = payloadFor("dish_items", {
        dish_id: dish.id,
        product_id: product.id,
        quantity: 50,
      });
      const dishPortion = payloadFor("dish_portions", {
        dish_id: dish.id,
        label: "small",
        amount: 1,
        unit: "g",
        grams: 50,
      });
      const res = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: {
          authorization: "Bearer test",
          "x-test-user-id": TEST_USER_ID!,
        },
        // Order matters: products + dishes before dish_items (FK).
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
      const product = payloadFor("products");
      const sched = payloadFor("schedule_foods", {
        product_id: product.id,
        type: "food",
      });
      const res = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: {
          authorization: "Bearer test",
          "x-test-user-id": TEST_USER_ID!,
        },
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

  describe("LWW edge cases", () => {
    it("rejects rows with user_id != jwt sub (user_id_mismatch)", async () => {
      // We craft a row but spoof user_id to a different uuid.
      const otherUuid = "00000000-0000-0000-0000-000000000001";
      const row = payloadFor("products", { user_id: otherUuid });
      // Don't track for cleanup — it never lands.
      inserted.pop();
      const res = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: {
          authorization: "Bearer test",
          "x-test-user-id": TEST_USER_ID!,
        },
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
      const v2 = payloadFor("products", {
        edit_count: 2,
        client_modified_at: new Date().toISOString(),
      });
      const fresh = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: {
          authorization: "Bearer test",
          "x-test-user-id": TEST_USER_ID!,
        },
        payload: { rows: [v2] },
      });
      expect(fresh.statusCode).toBe(200);
      expect((fresh.json() as { accepted: unknown[] }).accepted).toHaveLength(1);

      // Same id, lower edit_count — should be rejected.
      const v1 = { ...v2, edit_count: 1 };
      const stale = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers: {
          authorization: "Bearer test",
          "x-test-user-id": TEST_USER_ID!,
        },
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
      const row = payloadFor("products", {
        edit_count: 5,
        client_modified_at: new Date().toISOString(),
      });
      const headers = {
        authorization: "Bearer test",
        "x-test-user-id": TEST_USER_ID!,
      };
      const a = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers,
        payload: { rows: [row] },
      });
      const b = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers,
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
      const row = payloadFor("products");
      const headers = {
        authorization: "Bearer test",
        "x-test-user-id": TEST_USER_ID!,
      };
      // 1. Create.
      await app.inject({
        method: "POST",
        url: "/api/backup",
        headers,
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
        headers,
        payload: { rows: [deleteRow] },
      });
      expect(delRes.statusCode).toBe(200);

      // 3. Try to "resurrect" with a re-insert (same id, no deleted_at, even
      // higher edit_count) — backend's WHERE clause should keep it deleted.
      const resurrect = {
        ...row,
        edit_count: 99,
        client_modified_at: new Date(Date.now() + 2000).toISOString(),
        deleted_at: null,
      };
      const resRes = await app.inject({
        method: "POST",
        url: "/api/backup",
        headers,
        payload: { rows: [resurrect] },
      });
      expect(resRes.statusCode).toBe(200);

      // Verify in DB: row exists with deleted_at != null.
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
      "SUPABASE_DB_URL or TEST_USER_ID not set — see .env in apps/disher-backend-3.0",
      () => {},
    );
  });
}
