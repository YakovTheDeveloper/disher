import { config as loadDotenv } from "dotenv";
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Vitest globalSetup — runs ONCE before any test file, ONCE after all complete.
//
// Resets `disher_test` to a known state by dropping and recreating the
// `public` schema, then applying the own-auth init migration. Individual
// tests TRUNCATE between specs (see ./db-helpers.ts) — this setup is the
// once-per-run hard reset that guarantees schema matches the latest .sql.
//
// Without TEST_DATABASE_URL this skips and the DB-touching suites describe.skip
// themselves — 16 of the 28 spec files. That is a convenience for a laptop with
// no postgres, and a trap anywhere else: a green run that proved nothing looks
// exactly like a green run that proved everything.
//
// So it is a convenience ONLY off CI. Under CI a missing URL is a hard failure:
// the postgres service in .github/workflows/ci.yml exists precisely so those 16
// files run, and if the env line ever rots, the job must go red rather than
// rubber-stamp the 12 pure-logic files as a full suite.

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from the backend root regardless of where vitest was invoked
// from (process.cwd() can be the monorepo apps/ dir if run via --prefix).
loadDotenv({ path: join(__dirname, "../../.env") });

const MIGRATIONS_DIR = join(__dirname, "../../db/migrations");

function listMigrations(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+.*\.sql$/.test(f))
    .sort()
    .map((f) => join(MIGRATIONS_DIR, f));
}

export async function setup(): Promise<void> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    if (process.env.CI) {
      throw new Error(
        "[test-setup] TEST_DATABASE_URL is not set under CI. Refusing to run: the " +
          "DB-touching suites would skip and the job would pass having proved nothing. " +
          "Check the `env:` block of the backend job in .github/workflows/ci.yml.",
      );
    }
    console.warn(
      "[test-setup] TEST_DATABASE_URL not set — DB-touching suites will skip. " +
        "Set it in apps/disher-backend-3.0/.env to run the full suite.",
    );
    return;
  }

  // Point the in-process pools at the test DB. Both:
  //  - ../auth/server.ts reads LOCAL_DATABASE_URL (better-auth pool)
  //  - ../api/db.ts reads REMOTE_DATABASE_URL (backup handler pool)
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
  process.env.REMOTE_DATABASE_URL = url;

  // Tests must run with the gated email-verification flow regardless of what
  // the dev `.env` does. Local dev sets REQUIRE_EMAIL_VERIFICATION=false to
  // skip the inbox-click loop, but the C1 contract test asserts the gated
  // path (signUp returns token=null, signIn returns 403 EMAIL_NOT_VERIFIED,
  // verifyEmail flips the bit). Force-enable it before auth/server.ts imports
  // and constructs `betterAuth` — it reads process.env at module load.
  process.env.REQUIRE_EMAIL_VERIFICATION = "true";

  // Disable the Resend transport in tests. The dev .env carries a real
  // RESEND_API_KEY; if we leave it set, every signUp inside a test triggers a
  // real send via the sandbox `onboarding@resend.dev` sender, which 403s on
  // any address other than the account owner's own — flooding stderr with
  // `[auth] Resend send failed validation_error` per spec. Token capture for
  // the C1 contract happens via `globalThis.__verifyTokensByEmail` BEFORE the
  // dispatch (auth/server.ts), so disabling Resend doesn't affect any
  // assertion. Re-enable per-test by setting RESEND_API_KEY back if you ever
  // want to assert the dispatch payload (consider MSW for that).
  delete process.env.RESEND_API_KEY;

  // Same class of leak as Resend above, and it bites harder. The dev .env sets
  // ANALYSIS_CRITIC=on, and runAnalysisJob's `callCritic` defaults to
  // makeCriticCall() — a REAL fetch to openrouter.ai. Tests inject only
  // `callLLM`, so the critic stage stayed live: every analyze spec with a
  // non-empty draft made a paid network call to CRITIC_MODEL, and the real
  // model (correctly) pruned the fixture's ungrounded «ins» insight — which is
  // why `insights` came back [] and each job took ~3s instead of milliseconds.
  // That also made the fire-and-forget job outlive its test and deadlock the
  // next truncate. Off by default; a spec that wants the critic passes its own
  // callCritic.
  process.env.ANALYSIS_CRITIC = "off";

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

    for (const migration of listMigrations()) {
      const sql = readFileSync(migration, "utf8");
      await pool.query(sql);
    }
  } finally {
    await pool.end();
  }
}

export async function teardown(): Promise<void> {
  // No-op. Leaving the schema in place after the run is useful for debugging
  // a failed test (you can `psql $TEST_DATABASE_URL` and inspect rows).
  // The next run drops it again in setup().
}
