import { defineConfig } from "vitest/config";

// Backend test config (B2 — own-auth migration).
//
// globalSetup: drops and recreates the `public` schema on TEST_DATABASE_URL,
// then applies db/migrations/20260501000000_own_auth_init.sql once per run.
//
// pool: 'forks' + singleFork: true — every test file runs in the SAME process
// in series. DB integration tests share one schema and TRUNCATE between specs;
// parallel forks would race on writes against `disher_test`.
//
// Pure-logic tests (lww.test.ts, food-matcher.test.ts, free-text-food.test.ts)
// don't need this isolation but pay zero cost from running in series too —
// the suite is small.

export default defineConfig({
  test: {
    globalSetup: ["./src/test/global-setup.ts"],
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Default test timeout 5s is fine for unit tests; DB-touching tests
    // override per-it.
    testTimeout: 10_000,
  },
});
