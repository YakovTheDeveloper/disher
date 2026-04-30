// Supabase implementation of the AuthProvider contract. This is the seam
// where the rest of the app stops caring that supabase exists — everywhere
// else uses `authProvider` against the contract from `./types`.
//
// Migration plan (plans/supabase-to-own-solution-migration.md): Phase 1
// replaces this with a customAuthProvider; the contract stays put.

import type { AuthError as SupabaseAuthError, User } from '@supabase/supabase-js';
import { isAuthError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { authClient } from './authClient';
import type {
  AppUser,
  AuthChangeEvent,
  AuthError,
  AuthProvider,
  AuthResult,
} from './types';
import type { ErrorKind } from '@/shared/lib/errors/classify';

const TIMEOUT_TEXT_RE = /timed? ?out|timeout|aborted|abort(?:ed)?|signal is aborted|the operation was aborted/i;

// Map a supabase user (or null) onto our AppUser. Anonymous sessions are
// treated as "no session" — required-auth gate (CLAUDE.md) means
// pre-required-auth anon rows must not surface as logged-in users.
function toAppUser(user: User | null | undefined): AppUser | null {
  if (!user) return null;
  if (user.is_anonymous) return null;
  return { id: user.id, email: user.email ?? null };
}

/**
 * Map a supabase auth error onto our provider-neutral ErrorKind.
 * AuthRetryableFetchError is supabase's wrapper around underlying fetch
 * failures — those must surface as network/timeout/server, NOT as auth,
 * otherwise the user sees "wrong password" during a network outage.
 */
export function classifySupabaseAuthError(err: unknown): AuthError | null {
  if (!isAuthError(err)) return null;

  const e = err as SupabaseAuthError & { name: string; status?: number; code?: string };

  if (e instanceof AuthRetryableFetchError || e.name === 'AuthRetryableFetchError') {
    // status===0 + 'aborted' message = our AbortSignal.timeout fired.
    if ((!e.status || e.status === 0) && TIMEOUT_TEXT_RE.test(e.message ?? '')) {
      return { kind: 'timeout', message: e.message || 'Превышено время ожидания', raw: err };
    }
    // status===0 = browser never got a response (network/CORS/offline/Safari).
    if (!e.status || e.status === 0) {
      return { kind: 'network', message: e.message || 'Нет связи с сервером', raw: err };
    }
    // 5xx = upstream/gateway, retryable per supabase.
    if (e.status >= 500) {
      return { kind: 'server', message: e.message, status: e.status, raw: err };
    }
  }

  return { kind: 'auth', message: e.message, status: e.status, code: e.code, raw: err };
}

function fallbackKind(err: unknown, fallbackMsg = 'Что-то пошло не так'): ErrorKind {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : fallbackMsg;
  return { kind: 'unknown', message, raw: err };
}

let cachedUser: AppUser | null = null;

export const supabaseAuthProvider: AuthProvider = {
  async bootstrap() {
    const { data, error } = await authClient.getSession();
    if (error || !data.session) {
      cachedUser = null;
      return null;
    }
    cachedUser = toAppUser(data.session.user);
    return cachedUser;
  },

  async getAccessToken() {
    const { data } = await authClient.getSession();
    return data.session?.access_token ?? null;
  },

  async signIn(email, password): Promise<AuthResult> {
    const { data, error } = await authClient.signInWithPassword(email, password);
    if (error || !data.user) {
      return {
        ok: false,
        error: classifySupabaseAuthError(error) ?? fallbackKind(error ?? new Error('Sign-in failed')),
      };
    }
    const user = toAppUser(data.user);
    if (!user) {
      return { ok: false, error: { kind: 'auth', message: 'Anonymous sessions are not allowed', raw: data.user } };
    }
    cachedUser = user;
    return { ok: true, user };
  },

  async signUp(email, password): Promise<AuthResult> {
    const { data, error } = await authClient.signUp(email, password);
    if (error) {
      return {
        ok: false,
        error: classifySupabaseAuthError(error) ?? fallbackKind(error),
      };
    }
    const user = toAppUser(data.user);
    if (user) cachedUser = user;
    // Sign-up may succeed without a confirmed user (email-verify flow). The
    // store treats that the same as a successful signup — UI shows "check
    // your inbox" by inspecting `cachedUser` separately.
    return user
      ? { ok: true, user }
      : { ok: false, error: { kind: 'auth', message: 'Email confirmation required', code: 'email_not_confirmed', raw: data } };
  },

  async signOut() {
    try {
      await authClient.signOut();
    } catch (e) {
      // logout API can fail (network/403) — we wiped local state already, so
      // surface but don't block. Refresh token expiry handles the orphan.
      console.error('signOut failed (local state cleared anyway)', e);
    }
    cachedUser = null;
  },

  onAuthChange(cb) {
    const { data } = authClient.onAuthStateChange((event, session) => {
      const user = toAppUser(session?.user ?? null);
      cachedUser = user;
      const mapped = mapSupabaseEvent(event);
      if (mapped) cb(mapped, user);
    });
    return () => data.subscription.unsubscribe();
  },

  getCurrentUser() {
    return cachedUser;
  },
};

function mapSupabaseEvent(event: string): AuthChangeEvent | null {
  switch (event) {
    case 'SIGNED_IN':
    case 'INITIAL_SESSION':
      return 'signed_in';
    case 'SIGNED_OUT':
      return 'signed_out';
    case 'TOKEN_REFRESHED':
      return 'token_refreshed';
    case 'USER_UPDATED':
      return 'user_updated';
    // PASSWORD_RECOVERY, MFA_CHALLENGE_VERIFIED — not used in this app yet.
    default:
      return null;
  }
}
