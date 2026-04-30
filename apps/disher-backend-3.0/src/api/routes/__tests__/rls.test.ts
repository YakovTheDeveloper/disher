import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";

// 8.9 RLS policy test (P2).
//
// Verifies the row-level-security policies declared in 20260424000000_initial_schema.sql:
//   - <table>_select: user can SELECT only their own rows
//                     (products also: rows where user_id IS NULL)
//   - <table>_insert/update/delete: WITH CHECK / USING enforce user_id = auth.uid()
//
// The backend itself bypasses RLS (service Pool, validates user_id manually
// before every write). RLS is the second line of defence for any path that
// might hit Supabase REST directly. If the policies regress, third-party
// clients can leak across users — not detectable in /api/backup tests.
//
// Strategy: SET LOCAL "role"=authenticated + "request.jwt.claims" with sub=uid_a
// or uid_b inside a transaction, then assert SELECT/INSERT/UPDATE/DELETE
// behaviour. ROLLBACK at the end so nothing persists.
//
// auth.uid() reads (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid
// in Supabase. Setting that GUC inside a transaction simulates a logged-in user.

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const TEST_USER_ID = process.env.TEST_USER_ID;
const ready = Boolean(SUPABASE_DB_URL && TEST_USER_ID);
const describeIfReady = ready ? describe : describe.skip;

let pool: pg.Pool;

beforeAll(async () => {
  if (!ready) return;
  pool = new pg.Pool({
    connectionString: SUPABASE_DB_URL,
    max: 4,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });
});

afterAll(async () => {
  if (!ready) return;
  await pool?.end();
});

async function asUser<T>(uid: string, fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("begin");
    await c.query("set local role authenticated");
    await c.query(
      `set local "request.jwt.claims" = '${JSON.stringify({ sub: uid })}'`,
    );
    try {
      return await fn(c);
    } finally {
      await c.query("rollback");
    }
  } finally {
    c.release();
  }
}

describeIfReady("RLS policies", () => {
  // Use the live TEST_USER_ID for uid_a (real auth.users row required by FK).
  // For uid_b we need ANOTHER real auth.users row — pick from the live DB.
  let UID_A: string;
  let UID_B: string;

  beforeAll(async () => {
    if (!ready) return;
    UID_A = TEST_USER_ID!;
    const { rows } = await pool.query<{ id: string }>(
      `select id from auth.users where id != $1::uuid limit 1`,
      [UID_A],
    );
    if (rows.length === 0) {
      throw new Error(
        "RLS test needs at least 2 auth.users rows; live DB has only 1",
      );
    }
    UID_B = rows[0].id;
  });

  it("user_b cannot SELECT user_a's dishes", async () => {
    // Insert a dish as user_a (inside its own tx so the row actually exists
    // for user_b's tx; we'll clean it up afterwards using the service pool).
    const dishId = crypto.randomUUID();
    try {
      await pool.query(
        `insert into public.dishes (id, user_id, name, client_modified_at, edit_count)
         values ($1::uuid, $2::uuid, '_rls_test', now(), 0)`,
        [dishId, UID_A],
      );

      // user_b should not see it.
      const visibleToB = await asUser(UID_B, (c) =>
        c.query<{ id: string }>(
          `select id from public.dishes where id = $1::uuid`,
          [dishId],
        ),
      );
      expect(visibleToB.rows).toEqual([]);

      // user_a should see it.
      const visibleToA = await asUser(UID_A, (c) =>
        c.query<{ id: string }>(
          `select id from public.dishes where id = $1::uuid`,
          [dishId],
        ),
      );
      expect(visibleToA.rows).toHaveLength(1);
    } finally {
      await pool.query("delete from public.dishes where id = $1::uuid", [
        dishId,
      ]);
    }
  });

  it("user_b cannot INSERT a dish with user_id = uid_a", async () => {
    const dishId = crypto.randomUUID();
    let inserted = false;
    await asUser(UID_B, async (c) => {
      try {
        await c.query(
          `insert into public.dishes (id, user_id, name, client_modified_at, edit_count)
           values ($1::uuid, $2::uuid, '_rls_test', now(), 0)`,
          [dishId, UID_A],
        );
        inserted = true;
      } catch (err) {
        // Expected: RLS WITH CHECK fails -> 42501 new row violates RLS policy
        const msg = err instanceof Error ? err.message : String(err);
        expect(msg.toLowerCase()).toMatch(/row.*level.*security|policy/);
      }
    });
    expect(inserted, "user_b managed to insert under uid_a — RLS broken").toBe(
      false,
    );
  });

  it("user_b cannot UPDATE user_a's dish", async () => {
    const dishId = crypto.randomUUID();
    try {
      await pool.query(
        `insert into public.dishes (id, user_id, name, client_modified_at, edit_count)
         values ($1::uuid, $2::uuid, '_rls_test', now(), 0)`,
        [dishId, UID_A],
      );
      const result = await asUser(UID_B, (c) =>
        c.query(
          `update public.dishes set name = '_hacked' where id = $1::uuid`,
          [dishId],
        ),
      );
      // RLS makes the row invisible -> UPDATE affects 0 rows (no error).
      expect(result.rowCount).toBe(0);
      const fresh = await pool.query<{ name: string }>(
        `select name from public.dishes where id = $1::uuid`,
        [dishId],
      );
      expect(fresh.rows[0]?.name).toBe("_rls_test");
    } finally {
      await pool.query("delete from public.dishes where id = $1::uuid", [
        dishId,
      ]);
    }
  });

  it("user_b cannot DELETE user_a's dish", async () => {
    const dishId = crypto.randomUUID();
    try {
      await pool.query(
        `insert into public.dishes (id, user_id, name, client_modified_at, edit_count)
         values ($1::uuid, $2::uuid, '_rls_test', now(), 0)`,
        [dishId, UID_A],
      );
      const result = await asUser(UID_B, (c) =>
        c.query(`delete from public.dishes where id = $1::uuid`, [dishId]),
      );
      expect(result.rowCount).toBe(0);
      const fresh = await pool.query(
        `select 1 from public.dishes where id = $1::uuid`,
        [dishId],
      );
      expect(fresh.rows).toHaveLength(1);
    } finally {
      await pool.query("delete from public.dishes where id = $1::uuid", [
        dishId,
      ]);
    }
  });

  it("catalog rows (products.user_id IS NULL) are visible to every user", async () => {
    // Catalog has thousands of system rows already. Just count >0 visible
    // to two different uids.
    const a = await asUser(UID_A, (c) =>
      c.query<{ count: string }>(
        `select count(*)::text as count from public.products where user_id is null`,
      ),
    );
    const b = await asUser(UID_B, (c) =>
      c.query<{ count: string }>(
        `select count(*)::text as count from public.products where user_id is null`,
      ),
    );
    expect(Number(a.rows[0].count)).toBeGreaterThan(0);
    expect(Number(b.rows[0].count)).toBeGreaterThan(0);
    expect(a.rows[0].count).toBe(b.rows[0].count);
  });
});

if (!ready) {
  describe("RLS policies", () => {
    it.skip(
      "SUPABASE_DB_URL or TEST_USER_ID not set — see .env in apps/disher-backend-3.0",
      () => {},
    );
  });
}
