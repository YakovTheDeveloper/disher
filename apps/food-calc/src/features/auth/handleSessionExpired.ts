import { classifyError, type ErrorKind } from '@/shared/lib/errors/classify';
import { probeSessionLiveness } from '@/shared/lib/auth/authProvider';
import toaster from '@/shared/lib/toaster/toaster';
import { useAuthStore } from './auth-store';

// Single funnel for a mid-session 401 (the bearer token expired or was revoked
// while the app was open). Background paths — sync, analysis polling, the daily
// analysis request — can each hit a 401 long after login. Instead of each one
// inventing its own recovery, they route the error here.
//
// The honest recovery is an explicit re-login, NOT a hidden token refresh:
// better-auth session tokens are opaque/server-side, and a silent refresh would
// violate the auth invariant ([[auth-invariant]], [[signout-unconditional-local]]).
// So a CONFIRMED expiry warns once and signs the user out — signOut() wipes local
// state and flips AuthGate → AuthScreen.
//
// "Confirmed" is the load-bearing word: see confirmThenSignOut below. Signing out
// on an unverified 401 destroys unsynced edits, so the 401 is treated as a claim
// to be checked, not a verdict.
//
// Throttled to once per session: several background calls can fail 401 in the
// same instant, and we must not fire N toasts / N probes / N signOuts. The flag
// resets on reload (module re-init), on the next successful sign-in, and when a
// probe clears the session as alive.

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
  void confirmThenSignOut();
  return true;
}

/**
 * A 401 is a CLAIM that the session is dead, not proof of it. A proxy hiccup, a
 * mid-deploy backend, a captive portal — any of them can 401 a perfectly live
 * session, and acting on that claim is destructive: signOut() wipes Dexie, and
 * the finalSyncBeforeSignOut() that runs first pushes into the same sick backend
 * and fails, so the unsynced edits are gone for good.
 *
 * So we ask the server once more, and only sign out if it says dead a second
 * time. bootstrap() has always drawn this distinction (401/403 = revoked,
 * 5xx/network = transient); the mid-session funnel simply never inherited it.
 *
 * When the session IS dead, the final sync is pointless — it would push with a
 * revoked cookie and 401 again — so skip it.
 */
async function confirmThenSignOut(): Promise<void> {
  const liveness = await probeSessionLiveness();

  // `alive` and `unknown` both mean "stay signed in", but they are NOT the same
  // situation and must not say the same thing. `alive` = the server answered, with
  // a session — telling the user "нет связи" while they are demonstrably online
  // sends them chasing a network problem that isn't there, and buries the real
  // cause (a route 401ing on its own). `unknown` = we genuinely could not reach it.
  if (liveness === 'alive') {
    handled = false;
    toaster.warning('Не удалось выполнить запрос — попробуйте ещё раз');
    return;
  }

  if (liveness === 'unknown') {
    handled = false;
    toaster.warning('Нет связи с сервером — данные сохранены на устройстве');
    return;
  }

  toaster.warning('Сессия истекла — войдите снова');
  await useAuthStore.getState().signOut({ skipFinalSync: true });
}

/** Re-arm the funnel after a successful sign-in. */
export function resetSessionExpired(): void {
  handled = false;
}
