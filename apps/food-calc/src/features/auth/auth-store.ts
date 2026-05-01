import { create } from 'zustand';
import { authProvider, type AppUser, type AuthError } from '@/shared/lib/auth/authProvider';
import { db, SYNCED_TABLES } from '@/shared/lib/dexie/schema';
import { Sentry } from '@/shared/lib/observability/sentry';
import { defaultUserMessage, type ErrorKind } from '@/shared/lib/errors/classify';
import { clearAnalyticsCache } from '@/entities/analytics';

// Wipe Dexie local rows + analytics localStorage cache before switching
// identities. uid_old's Dexie rows would violate RLS under uid_new on next
// push (план: 42501); analytics cache was historically keyed without userId
// and could leak markdown across accounts on the same device.
async function wipeLocalData(): Promise<void> {
  await db.transaction('rw', SYNCED_TABLES.map((t) => db[t]), async () => {
    for (const t of SYNCED_TABLES) await db[t].clear();
  });
  clearAnalyticsCache();
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

function applyUser(set: (s: Partial<AuthState>) => void, user: AppUser | null) {
  if (!user) {
    set({ isLoggedIn: false, email: null, userId: null });
    Sentry.setUser(null);
    return;
  }
  set({
    isLoggedIn: true,
    email: user.email,
    userId: user.id,
  });
  // id only — email is PII (food diary).
  Sentry.setUser({ id: user.id });
}

function authFail(set: (s: Partial<AuthState>) => void, error: AuthError, op: 'auth.signIn' | 'auth.signUp') {
  Sentry.captureException(error.raw ?? error, {
    tags: {
      kind: error.kind,
      op,
      ...('status' in error && error.status !== undefined ? { status: String(error.status) } : {}),
      ...('code' in error && error.code ? { code: error.code } : {}),
    },
  });
  set({
    isLoading: false,
    error: defaultUserMessage(error),
    errorKind: error.kind,
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
    const user = await authProvider.bootstrap();
    applyUser(set, user);
    set({ isReady: true });
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null, errorKind: null });
    // Try the network call FIRST. If credentials are wrong we keep the current
    // session + local cache intact (G1 fix — the previous order wiped state
    // before validating, so a typo logged the user out).
    const result = await authProvider.signIn(email, password);
    if (!result.ok) {
      authFail(set, result.error, 'auth.signIn');
      return false;
    }
    // Success — switch identities. Old uid's pending writes would violate RLS
    // under the new user (план: 42501) — wipe Dexie before applying the new
    // identity. useLiveQuery re-reads Dexie on the next tick.
    try {
      await wipeLocalData();
    } catch (e) {
      console.error('cache clear after signIn failed', e);
    }
    applyUser(set, result.user);
    set({ isLoading: false });
    return true;
  },

  signUp: async (email, password) => {
    set({ isLoading: true, error: null, errorKind: null });
    const result = await authProvider.signUp(email, password);
    if (!result.ok) {
      authFail(set, result.error, 'auth.signUp');
      return false;
    }
    applyUser(set, result.user);
    set({ isLoading: false });
    return true;
  },

  signOut: async () => {
    // Clear local rows BEFORE signOut — they belong to uid_old and RLS will
    // block them after signOut (план: 42501). useLiveQuery re-reads on the
    // next tick, no separate query-cache to clear.
    try {
      await wipeLocalData();
    } catch (e) {
      console.error('cache clear before signOut failed', e);
    }
    await authProvider.signOut();
    applyUser(set, null);
  },

  logout: async () => {
    await get().signOut();
  },
}));

// Keep the store in sync with auth events (sign-in, sign-out, token refresh,
// user update). Anonymous sessions are filtered out inside the provider.
authProvider.onAuthChange((_event, user) => {
  applyUser(useAuthStore.setState, user);
});
