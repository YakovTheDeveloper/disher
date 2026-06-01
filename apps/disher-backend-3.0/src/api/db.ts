import pg from "pg";

// Single shared Pool to the remote production Postgres (currently hosted on
// Supabase via Session Pooler). Session mode supports prepared statements
// (default in pg) so no `prepare: false` gymnastics; Transaction mode would
// need prepare:false per supabase docs.
//
// connectionString must point at the Session pooler:
//   postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:5432/postgres
//
// We connect with the database superuser (not any JWT/service_role) — backend
// validates user_id === jwt.sub itself before every write. RLS does not run.
// (Supabase here is just managed Postgres hosting; auth is better-auth bearer.)

// Prefer REMOTE_DATABASE_URL (prod). In dev it's typically unset — fall back
// to LOCAL_DATABASE_URL so the same Postgres serves better-auth and /api/backup.
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
