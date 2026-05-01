import pg from "pg";

// Test DB helpers — used by individual tests in beforeEach to reset state
// without paying the cost of dropping/recreating the schema (which is what
// global-setup.ts does once per run).
//
// Truncating "users" CASCADE wipes account/session (FK to users.id) and all
// 8 disher user-data tables (also FK to users.id). `verification` has no FK,
// truncated separately.

/**
 * Wipe every row from every user-data table on the connected pool.
 * Idempotent — safe to call before each test.
 */
export async function truncateAllUserData(pool: pg.Pool): Promise<void> {
  // Single statement so PG can take all locks together; CASCADE walks FKs.
  // RESTART IDENTITY is harmless here (no serial cols) — kept for forward
  // compat if a serial is added later.
  await pool.query(
    `truncate table "users", "verification" restart identity cascade`,
  );
}

/**
 * Open a pool against TEST_DATABASE_URL with sane defaults for a test run.
 * Caller owns lifecycle (call .end() in afterAll).
 */
export function makeTestPool(): pg.Pool {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is required for DB-touching tests. " +
        "Set it in apps/disher-backend-3.0/.env",
    );
  }
  return new pg.Pool({
    connectionString: url,
    max: 4,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });
}
