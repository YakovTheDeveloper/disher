// The app's auth surface: the types the rest of the codebase speaks (AppUser,
// AuthResult, …) and the single better-auth implementation behind them. There
// used to be a vendor-neutral `AuthProvider` interface in types.ts and a
// switch-point re-exporting one of several impls — that shape is left over from
// the Supabase era; only one implementation has existed since.
//
// Session transport is an httpOnly cookie the browser attaches itself. JS never
// sees the credential, which means:
//  - there is nothing to read locally to answer "am I signed in?" — bootstrap
//    always asks the server (see the two timeout budgets below);
//  - `disher.lastUser` is the only local trace, and it is a render hint, not a
//    credential: it lets a returning user see their app instead of a login
//    screen while the session check is still in flight.
//
// Sessions are opaque server-side tokens (NOT JWT), no refresh — a 401 from
// /api/auth/get-session means sign-out. onAuthChange subscribes to better-auth's
// nanostore `session` atom and diffs against the previous user to emit
// signed_in / signed_out / user_updated.

import { authClient } from './betterAuthClient';
import { OAUTH_ERROR_PARAM } from './oauthReturn';
import type { ErrorKind } from '@/shared/lib/errors/classify';
import { classifyError } from '@/shared/lib/errors/classify';

export type AppUser = {
  id: string;
  email: string | null;
  /**
   * Coarse authorization role ('admin' | 'user' | null), read from `users.role`
   * on the server. Drives the client-side admin gate ONLY — never a security
   * boundary (the server guards every admin route itself).
   */
  role: string | null;
};

// Provider-neutral auth error shape. Reuses the project-wide ErrorKind so
// callers can pattern-match on `.kind` and surface the right toast.
// Provider-specific codes (`invalid_credentials`, `email_not_confirmed`, …)
// flow through `code` on the auth/validation kinds.
export type AuthError = ErrorKind;

export type AuthResult =
  | { ok: true; user: AppUser }
  | { ok: false; error: AuthError };

// signUp under requireEmailVerification never returns a user — the success case
// is "we sent a verification email, wait for the click". Modeled as a distinct
// result so callers can branch on `pendingVerification` without having to handle
// a `user: null` case in `AuthResult`.
export type SignUpResult =
  | { ok: true; pendingVerification: true; email: string }
  | { ok: false; error: AuthError };

// Session lifecycle events. There is no refresh event: sessions are opaque and
// never rotate, so nothing to announce between sign-in and sign-out.
export type AuthChangeEvent = 'signed_in' | 'signed_out' | 'user_updated';

// Absolutize an in-app path against the SPA's own origin. Non-negotiable for
// the OAuth redirect flows: better-auth hands `callbackURL` / `errorCallbackURL`
// straight to a `Location:` header, so a relative '/' resolves against the API
// origin (api.disher.life), not the app (disher.life) — the user lands on the
// backend's raw 404 JSON instead of coming home. Absolute in, absolute out.
function appURL(path: string): string {
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).toString();
}

// appURL + a query-param marker. The OAuth redirect legs need the marker IN the
// URL (not sessionStorage): it must survive the full leave-the-app round-trip
// through Telegram in any return context — new tab, PWA standalone, in-app
// browser handing back to the system one.
function appURLWithParam(path: string, param: string, value: string): string {
  if (typeof window === 'undefined') return path;
  const url = new URL(path, window.location.origin);
  url.searchParams.set(param, value);
  return url.toString();
}

// Map better-auth user shape onto our AppUser. The anonymous plugin is not
// loaded on the backend, so every user is "real" — no anon filtering needed.
function toAppUser(
  user: { id?: string; email?: string | null; role?: string | null } | null | undefined,
): AppUser | null {
  if (!user || !user.id) return null;
  // The better-auth client session type doesn't surface `role` (it's a
  // server-side additionalField), so read it defensively rather than trusting
  // the static shape.
  const role = (user as { role?: string | null }).role ?? null;
  return { id: user.id, email: user.email ?? null, role };
}

// Maps better-auth error codes (from BASE_ERROR_CODES on the server) onto
// our project-wide ErrorKind, reusing the codes that classify.ts already
// turns into Russian messages: invalid_credentials, user_already_exists,
// weak_password.
function mapBetterAuthErrorCode(code: string | undefined): string | undefined {
  if (!code) return undefined;
  switch (code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'invalid_credentials';
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return 'user_already_exists';
    case 'PASSWORD_TOO_SHORT':
      return 'weak_password';
    case 'EMAIL_NOT_VERIFIED':
      return 'email_not_confirmed';
    case 'INVALID_EMAIL':
      return undefined; // surfaces as validation; classify uses message
    default:
      return undefined;
  }
}

type BetterAuthErrorShape = {
  message?: string;
  status?: number;
  statusText?: string;
  code?: string;
};

function classifyBetterAuthError(err: BetterAuthErrorShape | undefined, raw: unknown): AuthError {
  // Network / timeout — better-auth client throws/rejects with a real
  // Error/TypeError; classifyError handles those uniformly.
  if (!err || typeof err.status !== 'number') {
    return classifyError(raw);
  }

  const code = mapBetterAuthErrorCode(err.code);
  const message = err.message || err.statusText || 'Auth error';

  if (err.status === 401 || err.status === 403) {
    return { kind: 'auth', message, status: err.status, code, raw };
  }
  if (err.status === 400 || err.status === 422) {
    return { kind: 'validation', message, status: err.status, code, raw };
  }
  if (err.status === 429) {
    return { kind: 'rate_limit', message, status: 429, raw };
  }
  if (err.status >= 500) {
    return { kind: 'server', message, status: err.status, code, raw };
  }
  return { kind: 'unknown', message, raw };
}

let cachedUser: AppUser | null = null;

// Two caps on the boot-time getSession call — the whole app render is gated
// behind it (AuthGate → null until bootstrap resolves), so it must never wait on
// the OS network timeout. Which cap applies depends on what we can fall back to:
//
//  - WARM (a lastUser is cached): a timeout costs nothing — we render their app
//    from Dexie and reconcile the session in the background. Keep it tight.
//  - COLD (no lastUser): the only fallback is AuthScreen, and aborting early
//    strands a user who DOES have a valid cookie back at the login button. This
//    is exactly the leg right after the Telegram redirect — first login, cold
//    mobile connection, nothing cached. Give the network real time.
const BOOTSTRAP_WARM_TIMEOUT_MS = 1000;
const BOOTSTRAP_COLD_TIMEOUT_MS = 5000;

// The mid-session liveness probe is not on the boot path — nothing is blocked on
// it, and the wrong answer costs the user their unsynced edits. Give it room to
// answer over a bad mobile link rather than time out into a false "dead".
const PROBE_TIMEOUT_MS = 8000;

// Persisted last-known user. Used as a fallback when bootstrap can't reach the
// server (network down / backend offline) — we keep the user signed in instead
// of bouncing them to AuthScreen. Wiped on explicit signOut or on a real 401/403
// from the server. See project_auth_invariant.md: «окно логина юзер не видит вне
// явного logout».
const LAST_USER_KEY = 'disher.lastUser';

function readLastUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(LAST_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as { id?: unknown }).id === 'string'
    ) {
      const obj = parsed as { id: string; email?: unknown; role?: unknown };
      return {
        id: obj.id,
        email: typeof obj.email === 'string' ? obj.email : null,
        role: typeof obj.role === 'string' ? obj.role : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function persistLastUser(user: AppUser | null) {
  if (!user) {
    localStorage.removeItem(LAST_USER_KEY);
    return;
  }
  try {
    localStorage.setItem(
      LAST_USER_KEY,
      JSON.stringify({ id: user.id, email: user.email, role: user.role }),
    );
  } catch {
    // Quota / private mode — ignore; next successful bootstrap will retry.
  }
}

/**
 * Ask the server, once, whether the session is actually dead.
 *
 * `dead` — the server explicitly rejected us (401/403) or answered 200 with no
 * session. `alive` — it answered with a session. `unknown` — we could not get an
 * answer (offline, 5xx, timeout); the caller must NOT treat this as a rejection.
 *
 * This is the same three-way split bootstrap() makes, hoisted out so the
 * mid-session 401 funnel can reuse it instead of inventing a second, laxer one.
 */
export async function probeSessionLiveness(): Promise<
  'dead' | 'alive' | 'unknown'
> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const { data, error } = await authClient.getSession({
      fetchOptions: { signal: controller.signal, cache: 'no-store' },
    });
    if (error) {
      const status =
        typeof (error as { status?: unknown }).status === 'number'
          ? (error as { status: number }).status
          : undefined;
      return status === 401 || status === 403 ? 'dead' : 'unknown';
    }
    return data?.user ? 'alive' : 'dead';
  } catch {
    // Thrown = network-shaped (offline, DNS, aborted). Never a revocation.
    return 'unknown';
  } finally {
    clearTimeout(timer);
  }
}

export const authProvider = {
  async bootstrap(): Promise<AppUser | null> {
    // The session lives in an httpOnly cookie, so there is no local check that
    // can short-circuit this: only the server knows whether we're signed in.
    // Every boot asks — including the leg back from Telegram, which is now just
    // an ordinary boot with a cookie already in place (no marker, no capture).
    //
    // better-auth rejects (TypeError: Failed to fetch) instead of returning
    // `{ error }` on network failure — backend down, offline, DNS, etc. We fall
    // back to the persisted last-known user so AuthGate doesn't bounce a
    // signed-in user to AuthScreen just because the backend is unreachable;
    // BackupGate will fail its push/pull quietly and Dexie keeps serving as the
    // local-first source of truth.
    //
    // CRITICAL: this await blocks the whole app boot — AuthGate renders nothing
    // until bootstrap resolves. fetch() has no default timeout, so a hung socket
    // (iOS reaching the backend's separate self-signed cert on :3100, captive
    // portal, dead TCP) would freeze the splash for ~60s until the OS network
    // stack gives up. Cap it with an AbortController; the budget depends on
    // whether we have a user to fall back to.
    const lastUser = readLastUser();
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(
      () => {
        timedOut = true;
        controller.abort();
      },
      lastUser ? BOOTSTRAP_WARM_TIMEOUT_MS : BOOTSTRAP_COLD_TIMEOUT_MS,
    );
    let getSessionResult: Awaited<ReturnType<typeof authClient.getSession>>;
    try {
      getSessionResult = await authClient.getSession({
        fetchOptions: { signal: controller.signal },
      });
    } catch (e) {
      console.warn('authProvider.bootstrap: getSession failed (network?)', e);
      cachedUser = lastUser;
      return cachedUser;
    } finally {
      clearTimeout(timer);
    }
    // An abort can surface as a thrown error (handled above) OR as a resolved
    // `{ error }` shape. The latter must NOT hit the wipe branch below — a
    // timeout is never a real revocation. Force the network-failure path.
    if (timedOut) {
      console.warn('authProvider.bootstrap: getSession timed out');
      cachedUser = lastUser;
      return cachedUser;
    }
    const { data, error } = getSessionResult;
    if (error) {
      // Only an EXPLICIT auth rejection means the session is truly dead: 401
      // (expired/revoked) or 403 (forbidden). Wipe the last-known user so a
      // later network-flake can't resurrect a revoked session.
      //
      // Any OTHER error — 5xx, 429, or a network-shaped error better-fetch
      // surfaced as `{ error }` (no numeric status) — is TRANSIENT: boot
      // local-first from the last-known user, exactly like the network-throw
      // (catch) and timeout branches above. Before this, ANY error logged the
      // user out, so a fast 500/502/429 in the boot window (deploy, pg-pool
      // restart, proxy) bounced a signed-in user to AuthScreen — and the
      // re-login cascaded a wipeLocalData that dropped unsynced edits.
      const status =
        typeof (error as { status?: unknown }).status === 'number'
          ? (error as { status: number }).status
          : undefined;
      if (status === 401 || status === 403) {
        persistLastUser(null);
        cachedUser = null;
        return null;
      }
      console.warn(
        'authProvider.bootstrap: getSession error, treating as transient',
        error,
      );
      cachedUser = lastUser;
      return cachedUser;
    }
    if (!data?.user) {
      // 200 with no session — the server explicitly says there is none (not a
      // transport failure): no cookie, or it's expired. Wipe, same as a 401.
      persistLastUser(null);
      cachedUser = null;
      return null;
    }
    cachedUser = toAppUser(data.user);
    persistLastUser(cachedUser);
    return cachedUser;
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (error || !data?.user) {
        return { ok: false, error: classifyBetterAuthError(error ?? undefined, error) };
      }
      const user = toAppUser(data.user);
      if (!user) {
        return { ok: false, error: { kind: 'auth', message: 'Empty user in sign-in response', raw: data } };
      }
      cachedUser = user;
      persistLastUser(user);
      return { ok: true, user };
    } catch (e) {
      return { ok: false, error: classifyError(e) };
    }
  },

  async signUp(email: string, password: string): Promise<SignUpResult> {
    try {
      // better-auth requires `name` on sign-up by default. Default to the
      // email local-part — the app doesn't surface the name field anywhere
      // and it is not used for auth decisions.
      const name = email.split('@')[0] || email;
      const { error } = await authClient.signUp.email({ email, password, name });
      // Under requireEmailVerification + autoSignIn:false, the server
      // returns 200 with `token: null` and (currently) no `user` field. We
      // treat absence of `error` as success — the verification email has
      // been queued. Anti-enumeration: better-auth also returns 200 for a
      // duplicate email, which is fine for this flow (the inbox-check view
      // is identical either way).
      if (error) {
        return { ok: false, error: classifyBetterAuthError(error ?? undefined, error) };
      }
      // Do NOT touch cachedUser — there is no session yet.
      return { ok: true, pendingVerification: true, email };
    } catch (e) {
      return { ok: false, error: classifyError(e) };
    }
  },

  async sendVerificationEmail(
    email: string,
  ): Promise<{ ok: true } | { ok: false; error: AuthError }> {
    try {
      // `callbackURL` is the final SPA route the user lands on after a
      // successful verification click. The backend rewrites the verification
      // link itself, so this value just needs to be a valid SPA path — '/'
      // sends them to the home page.
      const { error } = await authClient.sendVerificationEmail({ email, callbackURL: '/' });
      if (error) {
        return { ok: false, error: classifyBetterAuthError(error ?? undefined, error) };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: classifyError(e) };
    }
  },

  async signOut(): Promise<void> {
    // The cookie is httpOnly: only the server can actually clear it (sign-out
    // replies with an expiring Set-Cookie). If that call never lands — offline,
    // 500, hung socket — the cookie survives and a reload would sign the user
    // straight back in. We still clear the local state so the UI leaves
    // immediately, and the next successful boot reconciles.
    //
    // A 7s AbortController cap stops a hung socket (dead TCP / captive portal —
    // fetch has no default timeout) from freezing sign-out forever.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      await authClient.signOut({ fetchOptions: { signal: controller.signal } });
    } catch (e) {
      console.error('signOut failed (clearing local state anyway)', e);
    } finally {
      clearTimeout(timer);
    }
    persistLastUser(null);
    cachedUser = null;
  },

  /**
   * Kill every OTHER session of this user server-side; this device stays signed
   * in. The answer to "я потерял телефон": a session is opaque, never rotates
   * and lives 365 days, so a lost device stays inside until the row is deleted.
   *
   * Deliberately NOT `revokeSessions` (which would also kill the session of the
   * device the user is holding): they asked to evict the others, not to log
   * themselves out. Needs a valid session but NOT a fresh one — better-auth
   * gates this on sensitiveSessionMiddleware, not freshSessionMiddleware.
   */
  async revokeOtherSessions(): Promise<{ ok: true } | { ok: false; error: AuthError }> {
    try {
      const { error } = await authClient.revokeOtherSessions();
      if (error) {
        return { ok: false, error: classifyBetterAuthError(error ?? undefined, error) };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: classifyError(e) };
    }
  },

  async signInWithOAuth(
    providerId: string,
    callbackURL = '/',
  ): Promise<{ ok: false; error: AuthError } | undefined> {
    // Redirect-based OIDC (Telegram). On success better-auth returns a provider
    // authorize URL and the client redirects the browser to it — control leaves
    // the page. The success leg needs no marker: the callback sets the session
    // cookie and the browser brings it back on its own, so the return is an
    // ordinary boot. The error leg still carries `?authError=<provider>` for
    // AuthForm's banner. We only get a value back here when the redirect can't
    // be started.
    try {
      const { data, error } = await authClient.signIn.oauth2({
        providerId,
        callbackURL: appURL(callbackURL),
        errorCallbackURL: appURLWithParam(callbackURL, OAUTH_ERROR_PARAM, providerId),
      });
      if (error) {
        return { ok: false, error: classifyBetterAuthError(error ?? undefined, error) };
      }
      // Defensive: if the client didn't navigate itself, do it here.
      if (data?.url && typeof window !== 'undefined') {
        window.location.href = data.url;
      }
      return undefined;
    } catch (e) {
      return { ok: false, error: classifyError(e) };
    }
  },

  async linkOAuth(
    providerId: string,
    callbackURL = '/',
  ): Promise<{ ok: false; error: AuthError } | undefined> {
    // Same redirect shape as signInWithOAuth, but better-auth attaches the
    // provider to the CURRENT session's user instead of resolving/creating one.
    try {
      const target = appURL(callbackURL);
      const { data, error } = await authClient.oauth2.link({
        providerId,
        callbackURL: target,
        errorCallbackURL: target,
      });
      if (error) {
        return { ok: false, error: classifyBetterAuthError(error ?? undefined, error) };
      }
      if (data?.url && typeof window !== 'undefined') {
        window.location.href = data.url;
      }
      return undefined;
    } catch (e) {
      return { ok: false, error: classifyError(e) };
    }
  },

  async listLinkedProviders(): Promise<string[]> {
    try {
      const { data } = await authClient.listAccounts();
      return (data ?? []).map((a) => a.providerId);
    } catch {
      return [];
    }
  },

  onAuthChange(
    cb: (event: AuthChangeEvent, user: AppUser | null) => void,
  ): () => void {
    // better-auth exposes session as a nanostore atom on $store.atoms.session.
    // Subscribe to it; on each tick, diff the user id against the previous
    // snapshot and emit the matching event. This avoids React's useSession
    // hook (we have our own Zustand store driving UI; one subscription is
    // enough).
    type SessionAtomValue = {
      data?: { user?: { id?: string; email?: string | null; role?: string | null } | null } | null;
    } | null | undefined;

    const atom = (authClient as unknown as { $store?: { atoms?: { session?: { subscribe: (cb: (v: SessionAtomValue) => void) => () => void } } } })
      .$store?.atoms?.session;

    if (!atom?.subscribe) {
      // Defensive: if better-auth ever changes the atom shape, fall back to
      // a no-op subscription rather than crashing the app on boot.
      console.warn('authProvider: session atom unavailable, onAuthChange is no-op');
      return () => {};
    }

    let prevId: string | null = cachedUser?.id ?? null;

    const unsubscribe = atom.subscribe((value) => {
      const nextUser = toAppUser(value?.data?.user ?? null);
      const nextId = nextUser?.id ?? null;

      let event: AuthChangeEvent | null = null;
      if (nextId && !prevId) event = 'signed_in';
      else if (!nextId && prevId) event = 'signed_out';
      else if (nextId && prevId && nextId !== prevId) event = 'signed_in';
      else if (nextId && prevId && nextId === prevId) event = 'user_updated';

      prevId = nextId;
      cachedUser = nextUser;

      if (event === 'signed_out') persistLastUser(null);
      else if (event === 'signed_in' || event === 'user_updated') persistLastUser(nextUser);

      if (event) cb(event, nextUser);
    });

    return unsubscribe;
  },

  getCurrentUser(): AppUser | null {
    return cachedUser;
  },
};
