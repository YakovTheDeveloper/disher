// better-auth implementation of the AuthProvider contract. Replaces
// supabaseAuthProvider as the active backend behind `authProvider`. The rest
// of the app (auth-store, useUserId, authedFetch) keeps consuming the same
// interface from ./types — no call-site changes.
//
// Key differences vs supabase:
//  - sessions are opaque server-side tokens (NOT JWT), no refresh — a 401
//    from /api/auth/get-session means sign-out (we wipe the bearer key).
//  - `set-auth-token` header is captured in betterAuthClient.ts onSuccess
//    hook — we don't see the token here directly, only via localStorage.
//  - onAuthChange subscribes to better-auth's nanostore `session` atom and
//    diffs against the previous user to emit signed_in / signed_out /
//    user_updated. token_refreshed never fires (no refresh in bearer mode).

import { authClient, BEARER_KEY } from './betterAuthClient';
import type {
  AppUser,
  AuthChangeEvent,
  AuthError,
  AuthProvider,
  AuthResult,
  SignUpResult,
} from './types';
import { classifyError } from '@/shared/lib/errors/classify';

// Map better-auth user shape onto our AppUser. The anonymous plugin is not
// loaded on the backend, so every user is "real" — no anon filtering needed.
function toAppUser(user: { id?: string; email?: string | null } | null | undefined): AppUser | null {
  if (!user || !user.id) return null;
  return { id: user.id, email: user.email ?? null };
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

const SB_CLEANED_FLAG = 'disher.sb-cleaned';

// Hard cap on the boot-time getSession call. The whole app render is gated
// behind it (AuthGate → null until bootstrap resolves), so it must never wait
// on the OS network timeout. A healthy call returns in well under a second;
// anything past this is treated as a hung socket and we boot local-first
// instead (cachedUser ← readLastUser, session reconciles in the background).
const BOOTSTRAP_NET_TIMEOUT_MS = 1000;

// Persisted last-known user. Used as a fallback when bootstrap can't reach
// the server (network down / backend offline) but a bearer is still on disk
// — we keep the user signed in instead of bouncing them to AuthScreen. Wiped
// on explicit signOut or on a real 401/403 from the server. See
// project_auth_invariant.md: «окно логина юзер не видит вне явного logout».
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
      const obj = parsed as { id: string; email?: unknown };
      return { id: obj.id, email: typeof obj.email === 'string' ? obj.email : null };
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
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: user.id, email: user.email }));
  } catch {
    // Quota / private mode — ignore; next successful bootstrap will retry.
  }
}

export const betterAuthProvider: AuthProvider = {
  async bootstrap() {
    // One-shot legacy cleanup: drop any pre-migration `sb-*` localStorage keys
    // (Supabase auth tokens) from preview installs that hit this build. Gated
    // by `disher.sb-cleaned` so we only scan localStorage once per device.
    if (localStorage.getItem(SB_CLEANED_FLAG) !== '1') {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) localStorage.removeItem(key);
      }
      localStorage.setItem(SB_CLEANED_FLAG, '1');
    }

    // Skip the network entirely if there is no token — fresh install or
    // post-signOut. The reactive store will stay logged-out and AuthGate
    // shows the sign-in screen.
    if (!localStorage.getItem(BEARER_KEY)) {
      cachedUser = null;
      persistLastUser(null);
      return null;
    }
    // better-auth rejects (TypeError: Failed to fetch) instead of returning
    // `{ error }` on network failure — backend down, offline, DNS, etc. We
    // do NOT drop the token AND we fall back to the persisted last-known user
    // so AuthGate doesn't bounce a signed-in user to AuthScreen just because
    // the backend is unreachable. BackupGate will fail its push/pull quietly
    // and Dexie keeps serving as the local-first source of truth.
    //
    // CRITICAL: this await blocks the whole app boot — AuthGate renders
    // nothing until bootstrap resolves. fetch() has no default timeout, so a
    // hung socket (iOS reaching the backend's separate self-signed cert on
    // :3100, captive portal, dead TCP) freezes the splash for ~60s until the
    // OS network stack gives up. Cap it with an AbortController exactly like
    // signOut does — on timeout we treat it as a network failure (keep the
    // bearer, fall back to the last-known user, boot local-first).
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, BOOTSTRAP_NET_TIMEOUT_MS);
    let getSessionResult: Awaited<ReturnType<typeof authClient.getSession>>;
    try {
      getSessionResult = await authClient.getSession({
        fetchOptions: { signal: controller.signal },
      });
    } catch (e) {
      console.warn('betterAuthProvider.bootstrap: getSession failed (network?)', e);
      cachedUser = readLastUser();
      return cachedUser;
    } finally {
      clearTimeout(timer);
    }
    // An abort can surface as a thrown error (handled above) OR as a resolved
    // `{ error }` shape. The latter must NOT hit the token-wipe branch below —
    // a timeout is never a real revocation. Force the network-failure path.
    if (timedOut) {
      console.warn('betterAuthProvider.bootstrap: getSession timed out');
      cachedUser = readLastUser();
      return cachedUser;
    }
    const { data, error } = getSessionResult;
    if (error || !data?.user) {
      // 401 / expired / revoked — server explicitly says this token is dead,
      // so wipe both the bearer and the last-known user (don't let a future
      // network-flake resurrect a revoked session).
      localStorage.removeItem(BEARER_KEY);
      persistLastUser(null);
      cachedUser = null;
      return null;
    }
    cachedUser = toAppUser(data.user);
    persistLastUser(cachedUser);
    return cachedUser;
  },

  async getAccessToken() {
    return localStorage.getItem(BEARER_KEY);
  },

  async signIn(email, password): Promise<AuthResult> {
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

  async signUp(email, password): Promise<SignUpResult> {
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

  async sendVerificationEmail(email) {
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

  async signOut() {
    // Best-effort server revoke — even if /sign-out fails (network/500/etc)
    // we MUST clear the local bearer + cached user, otherwise the UI stays
    // "logged in" against a dead session. A 7s AbortController cap stops a
    // hung socket (dead TCP / captive portal — fetch has no default timeout)
    // from freezing sign-out forever; on abort we proceed to the local clear
    // exactly as on any other failure (the server session expires on its own).
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      await authClient.signOut({ fetchOptions: { signal: controller.signal } });
    } catch (e) {
      console.error('signOut failed (clearing local bearer anyway)', e);
    } finally {
      clearTimeout(timer);
    }
    localStorage.removeItem(BEARER_KEY);
    persistLastUser(null);
    cachedUser = null;
  },

  onAuthChange(cb) {
    // better-auth exposes session as a nanostore atom on $store.atoms.session.
    // Subscribe to it; on each tick, diff the user id against the previous
    // snapshot and emit the matching event. This avoids React's useSession
    // hook (we have our own Zustand store driving UI; one subscription is
    // enough).
    type SessionAtomValue = {
      data?: { user?: { id?: string; email?: string | null } | null } | null;
    } | null | undefined;

    const atom = (authClient as unknown as { $store?: { atoms?: { session?: { subscribe: (cb: (v: SessionAtomValue) => void) => () => void } } } })
      .$store?.atoms?.session;

    if (!atom?.subscribe) {
      // Defensive: if better-auth ever changes the atom shape, fall back to
      // a no-op subscription rather than crashing the app on boot.
      console.warn('betterAuthProvider: session atom unavailable, onAuthChange is no-op');
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

  getCurrentUser() {
    return cachedUser;
  },
};
