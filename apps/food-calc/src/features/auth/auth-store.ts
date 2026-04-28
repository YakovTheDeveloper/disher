import { create } from 'zustand';
import { supabase } from '@/shared/api/supabase-client';
import { queryClient } from '@/shared/lib/storage/queryClient';
import { clearPending } from '@/shared/lib/storage/pendingWrites';
import { Sentry } from '@/shared/lib/observability/sentry';

type AuthState = {
  isLoggedIn: boolean;
  email: string | null;
  userId: string | null;
  /** True until the initial session check resolves. UI should show a splash while it is true. */
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
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

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  isLoggedIn: false,
  email: null,
  userId: null,
  isReady: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

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
    set({ isLoading: true, error: null });
    // Try the network call FIRST. If credentials are wrong we keep the current
    // session + local cache + outbox intact (G1 fix — the previous order wiped
    // state before validating, so a typo logged the user out).
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      set({ isLoading: false, error: error?.message ?? 'Sign-in failed' });
      return false;
    }
    // Success — switch identities. Old uid's pending writes would violate RLS
    // under the new user (план: 42501), and cached queries keyed by the old
    // userId must not leak into the signed-in account.
    try {
      await clearPending();
      queryClient.clear();
    } catch (e) {
      console.error('cache clear after signIn failed', e);
    }
    applyUser(set, data.user);
    set({ isLoading: false });
    return true;
  },

  signUp: async (email, password) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ isLoading: false, error: error.message });
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
      await clearPending();
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
