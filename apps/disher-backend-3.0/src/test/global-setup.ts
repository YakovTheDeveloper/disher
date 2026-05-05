import { config as loadDotenv } from "dotenv";
import pg from "pg";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Vitest globalSetup — runs ONCE before any test file, ONCE after all complete.
//
// Resets `disher_test` to a known state by dropping and recreating the
// `public` schema, then applying the own-auth init migration. Individual
// tests TRUNCATE between specs (see ./db-helpers.ts) — this setup is the
// once-per-run hard reset that guarantees schema matches the latest .sql.
//
// Skips silently if TEST_DATABASE_URL is not set so CI without DB stays
// green. The DB-touching tests themselves also describe.skip on missing env,
// so a missing setup just means those suites won't run.

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from the backend root regardless of where vitest was invoked
// from (process.cwd() can be the monorepo apps/ dir if run via --prefix).
loadDotenv({ path: join(__dirname, "../../.env") });

const INIT_MIGRATION = join(
  __dirname,
  "../../db/migrations/20260501000000_own_auth_init.sql",
);

export async function setup(): Promise<void> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    console.warn(
      "[test-setup] TEST_DATABASE_URL not set — DB-touching suites will skip. " +
        "Set it in apps/disher-backend-3.0/.env to run the full suite.",
    );
    return;
  }

  // Point the in-process pools at the test DB. Both:
  //  - ../auth/server.ts reads LOCAL_DATABASE_URL (better-auth pool)
  //  - ../api/db.ts reads SUPABASE_DB_URL (backup handler pool)
  // construct their pg.Pool at module load. Overriding both env vars here
  // means every test that imports `auth` or `pool` writes into disher_test,
  // NOT into disher_dev or production Supabase. Critical for FK consistency:
  // user created via auth.api.signUpEmail (auth pool) must be visible to the
  // backup handler (db pool) on FK lookup.
  //
  // Caveat: setup() runs in vitest's parent process; child workers inherit
  // process.env, so the overrides propagate. singleFork:true in vitest.config
  // keeps this true even with parallelism.
  process.env.LOCAL_DATABASE_URL = url;
  process.env.SUPABASE_DB_URL = url;

  // Tests must run with the gated email-verification flow regardless of what
  // the dev `.env` does. Local dev sets REQUIRE_EMAIL_VERIFICATION=false to
  // skip the inbox-click loop, but the C1 contract test asserts the gated
  // path (signUp returns token=null, signIn returns 403 EMAIL_NOT_VERIFIED,
  // verifyEmail flips the bit). Force-enable it before auth/server.ts imports
  // and constructs `betterAuth` — it reads process.env at module load.
  process.env.REQUIRE_EMAIL_VERIFICATION = "true";

  const pool = new pg.Pool({
    connectionString: url,
    max: 1,
    connectionTimeoutMillis: 10_000,
  });

  try {
    // Hard reset: nuke `public` and recreate. Drops every table, type, index,
    // function — equivalent of a fresh DB without the DROP DATABASE dance.
    await pool.query("drop schema if exists public cascade");
    await pool.query("create schema public");
    // Restore default privileges so subsequent CREATE EXTENSION / CREATE TYPE
    // inside the migration succeeds.
    await pool.query("grant all on schema public to public");

    const migration = readFileSync(INIT_MIGRATION, "utf8");
    await pool.query(migration);
  } finally {
    await pool.end();
  }
}

export async function teardown(): Promise<void> {
  // No-op. Leaving the schema in place after the run is useful for debugging
  // a failed test (you can `psql $TEST_DATABASE_URL` and inspect rows).
  // The next run drops it again in setup().
}
