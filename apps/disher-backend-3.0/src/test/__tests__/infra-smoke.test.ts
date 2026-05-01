import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../auth-helpers.js";
import { makeTestPool, truncateAllUserData } from "../db-helpers.js";

// B2 infra smoke — proves the test scaffold works end-to-end:
//   1. global-setup ran (schema applied, LOCAL_DATABASE_URL pointed at test DB)
//   2. createTestUser hits auth.api.signUpEmail and returns a bearer token
//   3. The created user is visible in public.users on the test pool
//   4. truncateAllUserData wipes between tests (FK cascade includes session/account)
//
// If this passes, the backup-test rewrites in steps 6-8 can rely on
// createTestUser without re-proving the plumbing.

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

describeIfReady("test infrastructure", () => {
  const pool = makeTestPool();

  beforeEach(async () => {
    await truncateAllUserData(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("createTestUser returns a userId that exists in public.users", async () => {
    const u = await createTestUser({ email: "smoke-1@example.com" });
    expect(u.userId).toMatch(/^[0-9a-f-]{36}$/);
    expect(u.sessionToken.length).toBeGreaterThan(20);
    expect(u.headers.authorization).toBe(`Bearer ${u.sessionToken}`);

    const { rows } = await pool.query<{ id: string; email: string }>(
      `select id, email from public.users where id = $1`,
      [u.userId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("smoke-1@example.com");
  });

  it("creates a session row in public.session linked to the user", async () => {
    const u = await createTestUser();
    const { rows } = await pool.query<{ userId: string }>(
      `select "userId" from public.session where "userId" = $1`,
      [u.userId],
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it("truncateAllUserData clears users + cascades to session/account", async () => {
    await createTestUser();
    await createTestUser();
    const before = await pool.query<{ count: string }>(
      `select count(*)::text from public.users`,
    );
    expect(Number(before.rows[0].count)).toBe(2);

    await truncateAllUserData(pool);

    const afterUsers = await pool.query<{ count: string }>(
      `select count(*)::text from public.users`,
    );
    const afterSession = await pool.query<{ count: string }>(
      `select count(*)::text from public.session`,
    );
    const afterAccount = await pool.query<{ count: string }>(
      `select count(*)::text from public.account`,
    );
    expect(Number(afterUsers.rows[0].count)).toBe(0);
    expect(Number(afterSession.rows[0].count)).toBe(0);
    expect(Number(afterAccount.rows[0].count)).toBe(0);
  });

  it("init migration created all 8 disher tables", async () => {
    const expected = [
      "products",
      "dishes",
      "dish_items",
      "dish_portions",
      "schedule_foods",
      "schedule_events",
      "daily_norms",
      "periods",
    ];
    const { rows } = await pool.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' and table_name = any($1::text[])`,
      [expected],
    );
    const found = rows.map((r) => r.table_name).sort();
    expect(found).toEqual([...expected].sort());
  });
});
