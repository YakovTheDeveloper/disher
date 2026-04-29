import pg from "pg";

// Single shared Pool to Supabase Postgres via Session Pooler.
// Session mode supports prepared statements (default in pg) so no `prepare: false`
// gymnastics; Transaction mode would need prepare:false per supabase docs.
//
// connectionString must point at the Session pooler:
//   postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:5432/postgres
//
// We connect with the database superuser (not service_role JWT) — backend
// validates user_id === jwt.sub itself before every write. RLS does not run.

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  console.warn(
    "[db] SUPABASE_DB_URL not set — backup endpoint will reject all requests"
  );
}

export const pool = SUPABASE_DB_URL
  ? new pg.Pool({
      connectionString: SUPABASE_DB_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  : null;

export function isDbReady(): boolean {
  return pool !== null;
}
