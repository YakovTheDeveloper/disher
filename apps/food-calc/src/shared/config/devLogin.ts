// Credentials for the dev-only «Войти (Dev)» button on AuthScreen. They must
// match the account seeded on the backend (apps/disher-backend-3.0/src/auth/
// seed-dev.ts) — change BOTH together, or the button signs in with credentials
// the seed never created. Overridable per-machine via VITE_DEV_LOGIN_* in
// .env.local.
//
// These are throwaway dev credentials by design — the backend seed refuses to
// run in production, so this account never exists on a real deployment.

export const DEV_LOGIN_EMAIL =
  import.meta.env.VITE_DEV_LOGIN_EMAIL || 'dev@disher.local';

export const DEV_LOGIN_PASSWORD =
  import.meta.env.VITE_DEV_LOGIN_PASSWORD || 'dev-password-2026';
