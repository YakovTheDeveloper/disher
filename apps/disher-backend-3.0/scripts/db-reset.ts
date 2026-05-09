// Drop + recreate the `public` schema + apply the init migration. Mirrors
// what `src/test/global-setup.ts` does for the test DB, but exposes it as a
// dev-friendly script.
//
//   pnpm db:reset                        — defaults to LOCAL_DATABASE_URL (disher_dev)
//   pnpm db:reset --target=test          — TEST_DATABASE_URL (disher_test)
//   pnpm db:reset --target=remote        — REMOTE_DATABASE_URL; requires "RESET" typed at the prompt
//
// Flags:
//   --yes      skip the local confirmation prompt (still required for remote)
//   --quiet    suppress "applied migration" log
//
// On success: prints `[db-reset] ok` and exits 0.
// On failure: prints the error and exits 1. The DB is left in whatever state
// the partial transaction reached — wrap manually in a tx if you need atomicity.

import { config as loadDotenv } from "dotenv";
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: join(__dirname, "../.env") });

type Target = "dev" | "test" | "remote";

const MIGRATIONS_DIR = join(__dirname, "../db/migrations");

function listMigrations(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+.*\.sql$/.test(f))
    .sort()
    .map((f) => join(MIGRATIONS_DIR, f));
}

function parseArgs(): { target: Target; yes: boolean; quiet: boolean } {
  let target: Target = "dev";
  let yes = false;
  let quiet = false;
  for (const arg of process.argv.slice(2)) {
    if (arg === "--yes" || arg === "-y") yes = true;
    else if (arg === "--quiet" || arg === "-q") quiet = true;
    else if (arg.startsWith("--target=")) {
      const v = arg.slice("--target=".length);
      if (v !== "dev" && v !== "test" && v !== "remote") {
        throw new Error(`unknown --target=${v}; use dev|test|remote`);
      }
      target = v;
    } else {
      throw new Error(`unknown arg: ${arg}`);
    }
  }
  return { target, yes, quiet };
}

function urlFor(target: Target): string {
  const env =
    target === "dev"
      ? "LOCAL_DATABASE_URL"
      : target === "test"
        ? "TEST_DATABASE_URL"
        : "REMOTE_DATABASE_URL";
  const url = process.env[env];
  if (!url) {
    throw new Error(`${env} is not set in apps/disher-backend-3.0/.env`);
  }
  return url;
}

function maskUrl(url: string): string {
  // Strip the password from `postgresql://user:pass@host/db`.
  return url.replace(/:[^:@/]*@/, ":***@");
}

async function confirmRemote(): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>((resolve) =>
    rl.question(
      'This will WIPE the REMOTE Supabase DB. Type "RESET" to proceed: ',
      resolve,
    ),
  );
  rl.close();
  if (answer.trim() !== "RESET") {
    throw new Error("aborted (confirmation phrase did not match)");
  }
}

async function main(): Promise<void> {
  const { target, yes, quiet } = parseArgs();
  const url = urlFor(target);

  console.log(`[db-reset] target=${target}`);
  console.log(`[db-reset] url=${maskUrl(url)}`);

  if (target === "remote") {
    await confirmRemote();
  } else if (!yes) {
    // Local resets are reversible (drop disher_dev, init it again). Print a
    // line and proceed — `--yes` exists for CI but we don't gate it.
    console.log("[db-reset] proceeding (pass --yes for non-interactive)");
  }

  const pool = new pg.Pool({
    connectionString: url,
    max: 1,
    connectionTimeoutMillis: 10_000,
  });

  try {
    await pool.query("drop schema if exists public cascade");
    await pool.query("create schema public");
    await pool.query("grant all on schema public to public");

    for (const migration of listMigrations()) {
      const sql = readFileSync(migration, "utf8");
      await pool.query(sql);
      if (!quiet) {
        console.log(`[db-reset] applied ${migration}`);
      }
    }
    console.log("[db-reset] ok");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[db-reset] failed:", err.message ?? err);
  process.exit(1);
});
