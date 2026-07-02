import { classifyError, type ErrorKind } from '@/shared/lib/errors/classify';
import toaster from '@/shared/lib/toaster/toaster';
import { useAuthStore } from './auth-store';

// Single funnel for a mid-session 401 (the bearer token expired or was revoked
// while the app was open). Background paths — sync, analysis polling, the daily
// analysis request — can each hit a 401 long after login. Instead of each one
// inventing its own recovery, they route the error here.
//
// The honest recovery is an explicit re-login, NOT a hidden token refresh:
// better-auth bearer tokens are opaque/server-side, and a silent refresh would
// violate the auth invariant ([[auth-invariant]], [[signout-unconditional-local]]).
// So we warn once and sign the user out — signOut() wipes local state and flips
// AuthGate → AuthScreen.
//
// Throttled to once per session: several background calls can fail 401 in the
// same instant, and we must not fire N toasts / N signOuts. The flag resets
// naturally on reload (module re-init) and on the next successful sign-in.

let handled = false;

function statusOf(kind: ErrorKind): number | undefined {
  return 'status' in kind && typeof kind.status === 'number' ? kind.status : undefined;
}

/**
 * If `input` is a mid-session 401, warn + signOut (once per session) and return
 * true. Otherwise return false so the caller keeps its own error handling.
 *
 * `input` may be a raw error, a Response-like `{status}`, or an already
 * classified `ErrorKind` — all are normalized through classifyError.
 */
export function handleSessionExpired(input: unknown): boolean {
  const kind: ErrorKind =
    input !== null && typeof input === 'object' && 'kind' in input && 'raw' in input
      ? (input as ErrorKind)
      : classifyError(input);

  if (kind.kind !== 'auth') return false;
  // Only a 401 is an expired session. 403 is CSRF/forbidden (see auth-store's
  // signIn branch) — not a session expiry. Absent status → don't guess.
  if (statusOf(kind) !== 401) return false;
  // A login-FORM error (invalid_credentials / email_not_confirmed …) carries a
  // `code` and is handled at the form — never sign the user out for a typo.
  if ('code' in kind && kind.code) return false;

  if (handled) return true;
  handled = true;
  toaster.warning('Сессия истекла — войдите снова');
  void useAuthStore.getState().signOut();
  return true;
}

/** Re-arm the funnel after a successful sign-in. */
export function resetSessionExpired(): void {
  handled = false;
}
