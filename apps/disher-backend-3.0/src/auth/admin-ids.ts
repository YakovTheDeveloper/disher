// Bootstrap admin allowlist. The FIRST admin can't be promoted via the DB (no
// admin exists yet to do it), so we seed admins from an env CSV instead of a SQL
// role update. Parsed LAZILY on every call (never cached) so tests can mutate
// process.env.ADMIN_USER_IDS between cases — and so requireAdmin re-reads it.
//
// Env-admins keep role='user' in the DB: the admin() plugin's adminUserIds
// option and requireAdmin's env branch both treat these ids as admin. Changing
// ADMIN_USER_IDS requires a backend restart (env is read at plugin construction
// time too) — documented in .env.

export function getAdminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
