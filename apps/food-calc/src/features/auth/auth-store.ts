import { create } from 'zustand';
import { supabase } from '@/powersync/supabase-client';
import { db } from '@/powersync/database';

type AuthState = {
  isLoggedIn: boolean;
  isAnonymous: boolean;
  email: string | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
};

type AuthActions = {
  checkAuth: () => Promise<void>;
  clearError: () => void;
  /** Sign in with email + password (existing account). Wipes local data first. */
  signIn: (email: string, password: string) => Promise<boolean>;
  /** Sign up a brand-new account (no existing anon session). */
  signUp: (email: string, password: string) => Promise<boolean>;
  /** Upgrade the current anonymous user to a permanent account. UUID stays the same. */
  upgradeAnonymous: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Alias for signOut. */
  logout: () => Promise<void>;
};

function applyUser(set: (s: Partial<AuthState>) => void, user: { id: string; email?: string | null; is_anonymous?: boolean } | null) {
  if (!user) {
    set({ isLoggedIn: false, isAnonymous: false, email: null, userId: null });
    return;
  }
  set({
    isLoggedIn: !user.is_anonymous,
    isAnonymous: !!user.is_anonymous,
    email: user.email ?? null,
    userId: user.id,
  });
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  isLoggedIn: false,
  isAnonymous: false,
  email: null,
  userId: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  checkAuth: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      applyUser(set, null);
      set({ isLoading: false });
      return;
    }
    applyUser(set, data.user);
    set({ isLoading: false });
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    // Wipe the local DB BEFORE switching identities — anon data must not bleed
    // into the signed-in account's local cache.
    try {
      await db.disconnectAndClear();
    } catch (e) {
      console.error('disconnectAndClear before signIn failed', e);
    }
    await supabase.auth.signOut();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      set({ isLoading: false, error: error?.message ?? 'Sign-in failed' });
      return false;
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

  upgradeAnonymous: async (email, password) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.updateUser({ email, password });
    if (error || !data.user) {
      set({ isLoading: false, error: error?.message ?? 'Upgrade failed' });
      return false;
    }
    applyUser(set, data.user);
    set({ isLoading: false });
    return true;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    applyUser(set, null);
  },

  logout: async () => {
    await get().signOut();
  },
}));

// Keep the store in sync with Supabase auth events fired by PowerSyncProvider
// (anonymous bootstrap, sign-in, sign-out, token refresh, user update).
supabase.auth.onAuthStateChange((_event, session) => {
  applyUser(useAuthStore.setState, session?.user ?? null);
});
