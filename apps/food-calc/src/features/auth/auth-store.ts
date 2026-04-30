import { create } from 'zustand';
import { supabase } from '@/shared/api/supabase-client';
import { queryClient } from '@/shared/lib/storage/queryClient';
import { db, SYNCED_TABLES } from '@/shared/lib/dexie/schema';
import { Sentry } from '@/shared/lib/observability/sentry';
import { classifyError, defaultUserMessage, type ErrorKind } from '@/shared/lib/errors/classify';

// Wipe Dexie local rows before switching identities. uid_old's rows would
// violate RLS under uid_new on next push (план: 42501), so we drop them
// rather than leak them into the new account.
async function wipeLocalData(): Promise<void> {
  await db.transaction('rw', SYNCED_TABLES.map((t) => db[t]), async () => {
    for (const t of SYNCED_TABLES) await db[t].clear();
  });
}

type AuthState = {
  isLoggedIn: boolean;
  email: string | null;
  userId: string | null;
  /** True until the initial session check resolves. UI should show a splash while it is true. */
  isReady: boolean;
  isLoading: boolean;
  /** Human-readable error string (already localized, dev-prefixed in dev). Read by AuthForm. */
  error: string | null;
  /**
   * Classified error kind for the last failed signIn/signUp. UI may use it to
   * decorate fields (e.g. highlight password vs email vs network banner).
   * Cleared on `clearError` and at the start of each new sign-in attempt.
   */
  errorKind: ErrorKind['kind'] | null;
};

type AuthActions = {
  /** Resolve the initial session from storage. Flips isReady to true when done. */
  bootstrap: () => Promise<void>;
  clearError: () => void;
  /** Sign in with email + password. Wipes local cache + outbox on success. */
  signIn: (email: string, password: string) => Promise<boolean>;
  /** Sign up a brand-new account. */
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Alias for signOut. */
  logout: () => Promise<void>;
};

type SupabaseUser = { id: string; email?: string | null; is_anonymous?: boolean };

function applyUser(set: (s: Partial<AuthState>) => void, user: SupabaseUser | null) {
  // Anonymous Supabase sessions left over from the pre-required-auth era are
  // treated as "no session" — the user must sign up or sign in to proceed.
  // Once those sessions age out / the user signs out, this branch goes away.
  const effective = user && !user.is_anonymous ? user : null;

  if (!effective) {
    set({ isLoggedIn: false, email: null, userId: null });
    Sentry.setUser(null);
    return;
  }
  set({
    isLoggedIn: true,
    email: effective.email ?? null,
    userId: effective.id,
  });
  // id only — email is PII (food diary).
  Sentry.setUser({ id: effective.id });
}

function authFail(set: (s: Partial<AuthState>) => void, error: unknown, op: 'auth.signIn' | 'auth.signUp') {
  const kind = classifyError(error);
  Sentry.captureException(error, {
    tags: {
      kind: kind.kind,
      op,
      ...('status' in kind && kind.status !== undefined ? { status: String(kind.status) } : {}),
      ...('code' in kind && kind.code ? { code: kind.code } : {}),
    },
  });
  set({
    isLoading: false,
    error: defaultUserMessage(kind),
    errorKind: kind.kind,
  });
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  isLoggedIn: false,
  email: null,
  userId: null,
  isReady: false,
  isLoading: false,
  error: null,
  errorKind: null,

  clearError: () => set({ error: null, errorKind: null }),

  bootstrap: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      applyUser(set, null);
      set({ isReady: true });
      return;
    }
    applyUser(set, data.session.user);
    set({ isReady: true });
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null, errorKind: null });
    // Try the network call FIRST. If credentials are wrong we keep the current
    // session + local cache + outbox intact (G1 fix — the previous order wiped
    // state before validating, so a typo logged the user out).
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      authFail(set, error ?? new Error('Sign-in failed'), 'auth.signIn');
      return false;
    }
    // Success — switch identities. Old uid's pending writes would violate RLS
    // under the new user (план: 42501), and cached queries keyed by the old
    // userId must not leak into the signed-in account.
    try {
      await wipeLocalData();
      queryClient.clear();
    } catch (e) {
      console.error('cache clear after signIn failed', e);
    }
    applyUser(set, data.user);
    set({ isLoading: false });
    return true;
  },

  signUp: async (email, password) => {
    set({ isLoading: true, error: null, errorKind: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      authFail(set, error, 'auth.signUp');
      return false;
    }
    if (data.user) applyUser(set, data.user);
    set({ isLoading: false });
    return true;
  },

  signOut: async () => {
    // Clear queue + cache BEFORE signOut — the queue belongs to uid_old and
    // RLS will block all of its rows after signOut (план: 42501).
    try {
      await wipeLocalData();
      queryClient.clear();
    } catch (e) {
      console.error('cache clear before signOut failed', e);
    }
    await supabase.auth.signOut();
    applyUser(set, null);
  },

  logout: async () => {
    await get().signOut();
  },
}));

// Keep the store in sync with Supabase auth events (sign-in, sign-out, token
// refresh, user update). Anonymous sessions are filtered out by applyUser.
supabase.auth.onAuthStateChange((_event, session) => {
  applyUser(useAuthStore.setState, session?.user ?? null);
});
