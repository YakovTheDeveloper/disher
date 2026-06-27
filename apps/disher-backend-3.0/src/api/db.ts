import pg from "pg";

// Single shared Pool for /api/backup + /api/analyze + wallet. Points at the
// self-hosted Postgres (the postgres service in docker-compose; formerly
// Supabase managed PG). The backend validates user_id === session.userId itself
// before every write — RLS does not run; this is plain Postgres, auth is
// better-auth bearer.
//
// env unification: better-auth (auth/server.ts) reads ONLY LOCAL_DATABASE_URL,
// so prod sets a single LOCAL_DATABASE_URL pointing at the postgres service and
// leaves REMOTE_DATABASE_URL unset — both pools then hit the SAME database.
// REMOTE_DATABASE_URL is retained only as an optional override (legacy / a
// distinct managed PG); when unset we fall back to LOCAL so dev and prod share
// one Postgres for better-auth and /api/backup.
const connectionString =
  process.env.REMOTE_DATABASE_URL ?? process.env.LOCAL_DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[db] neither REMOTE_DATABASE_URL nor LOCAL_DATABASE_URL is set — backup endpoint will reject all requests"
  );
} else if (!process.env.REMOTE_DATABASE_URL) {
  console.log("[db] using LOCAL_DATABASE_URL for /api/backup (dev fallback)");
}

export const pool = connectionString
  ? new pg.Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  : null;
