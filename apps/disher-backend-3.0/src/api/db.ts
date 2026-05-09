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

const REMOTE_DATABASE_URL = process.env.REMOTE_DATABASE_URL;

if (!REMOTE_DATABASE_URL) {
  console.warn(
    "[db] REMOTE_DATABASE_URL not set — backup endpoint will reject all requests"
  );
}

export const pool = REMOTE_DATABASE_URL
  ? new pg.Pool({
      connectionString: REMOTE_DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  : null;

export function isDbReady(): boolean {
  return pool !== null;
}
