import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// 8.2 Migration chain smoke (P0).
//
// Reads every .sql in apps/food-calc/supabase/migrations/ in lexical order and
// applies them inside a single transaction against a freshly created scratch
// schema, then ROLLBACKs. Catches:
//   - syntax errors in any migration
//   - references to columns/types removed by an earlier migration
//   - seed inserts that reference dropped columns / wrong jsonb shape
//
// Strategy: rewrite `public.` → `<scratch>.` and `set search_path = ...` so
// unqualified identifiers resolve to the scratch schema. `auth.users`,
// `auth.uid()`, and `extensions.*` references stay as-is — they exist on the
// live Supabase and FKs to auth.users are valid (rolled back at end).
//
// On rollback the scratch schema disappears with the transaction; nothing
// persists in live DB.

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const MIGRATIONS_DIR = join(
  __dirname,
  "../../../../../food-calc/supabase/migrations",
);

const describeIfDb = SUPABASE_DB_URL ? describe : describe.skip;

describeIfDb("migration chain smoke", () => {
  const pool = new pg.Pool({
    connectionString: SUPABASE_DB_URL,
    max: 2,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
    // Big seed file = long single statement; bump statement timeout.
    statement_timeout: 120_000,
  });

  afterAll(async () => {
    await pool.end();
  });

  it("applies every .sql in apps/food-calc/supabase/migrations/ in order", async () => {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    expect(files.length, "no .sql migrations found").toBeGreaterThan(0);

    const scratch = `mig_smoke_${Date.now()}_${Math.floor(
      Math.random() * 1e6,
    )}`;
    const client = await pool.connect();
    try {
      await client.query("begin");
      try {
        await client.query(`create schema "${scratch}"`);
        // search_path so unqualified identifiers (e.g. "products" in seed
        // RETURNING clauses, type names like "schedule_food_type") resolve
        // inside the scratch schema. extensions kept for uuid_generate_v5.
        await client.query(
          `set local search_path = "${scratch}", extensions, public`,
        );

        for (const file of files) {
          const raw = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
          // Rewrite every `public.` qualifier — the only schema migrations
          // hard-code. Other schemas (auth, extensions, pg_*) untouched.
          const rewritten = raw.replace(/\bpublic\./g, `"${scratch}".`);
          try {
            await client.query(rewritten);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(`migration ${file} failed: ${msg}`);
          }
        }
      } finally {
        // Always rollback — this is a smoke, not a deploy.
        await client.query("rollback");
      }
    } finally {
      client.release();
    }
  }, 180_000);
});

if (!SUPABASE_DB_URL) {
  describe("migration chain smoke", () => {
    it.skip(
      "SUPABASE_DB_URL not set — set it in apps/disher-backend-3.0/.env to run this test",
      () => {},
    );
  });
}
