import { create } from 'zustand';
import { authProvider, type AppUser, type AuthError } from '@/shared/lib/auth/authProvider';
import { db } from '@/shared/lib/dexie/schema';
import { resetClock } from '@/shared/lib/dexie/write';
import { Sentry } from '@/shared/lib/observability/sentry';
import { defaultUserMessage, type ErrorKind } from '@/shared/lib/errors/classify';
import { clear as idbKeyvalClear } from 'idb-keyval';
import { drawerStore } from '@/shared/ui/drawer-store';
import { modalStore } from '@/shared/ui/modal-store';
import { useSyncPrefStore } from '@/shared/lib/sync-pref';
import { syncNow } from '@/shared/lib/snapshot';
import { resetSessionExpired } from './handleSessionExpired';
import toaster from '@/shared/lib/toaster/toaster';

// Wipe every Dexie store + the parallel idb-keyval namespace (Zustand persist
// drafts) before switching identities. Without this clear, user B on a shared
// device sees user A's data through one of two storages.
async function wipeLocalData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });
  // best-effort: the Dexie wipe above is the load-bearing step; a failed
  // idb-keyval clear only leaves stale Zustand drafts, no user data is lost.
  // eslint-disable-next-line no-restricted-syntax
  await idbKeyvalClear().catch(() => {});
  // The monotonic clock's high-water mark lives in localStorage (survives both
  // wipes above). Reset it on identity switch so user A's fast/poisoned clock
  // can't leak future stamps into user B's fleet (И-13) — same shared-device
  // hazard the data wipe closes, same explicit reset the sync-consent flag gets.
  resetClock();
}

// Ceiling for the final pre-signOut sync. `fetch` has no default timeout and the
// 'disher-sync' Web Lock waits forever if another tab holds it — without this
// bound a hung server (seen in prod) leaves the user watching a sign-out that
// never lands and cannot be cancelled.
const FINAL_SYNC_TIMEOUT_MS = 12_000;

/**
 * Best-effort FINAL sync before sign-out tears local state down. There is no
 * sync scheduler or beforeunload flush, so edits made since the last push live
 * only in Dexie — and signOut wipes Dexie. Push them first while the session is
 * still valid (this MUST run before the server revoke, which would 401 the push).
 *
 * Never throws: returns `true` when the vault is up to date (including the
 * sync-OFF case, where there is nothing to lose), `false` when the push failed
 * or timed out. A `false` is the caller's cue to ASK before wiping — the user is
 * about to destroy the only copy of those edits.
 */
export async function finalSyncBeforeSignOut(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FINAL_SYNC_TIMEOUT_MS);
  try {
    await syncNow({ signal: controller.signal });
    return true;
  } catch (e) {
    console.error('final sync before signOut failed', e);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

type AuthState = {
  isLoggedIn: boolean;
  email: string | null;
  userId: string | null;
  /**
   * Auth-provider role (better-auth admin plugin): 'admin' | 'user' | null.
   * Read by `useIsAdmin` as the fast path — 'admin' unlocks the admin gate
   * immediately; anything else falls back to a server probe (env-admins are
   * role 'user'). Never a security boundary; the server guards admin routes.
   */
  role: string | null;
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
  /**
   * Email of an account that has signed up (or attempted signIn) but hasn't
   * verified yet. Drives the "check your inbox" branch in AuthScreen. Set by
   * a successful signUp and by a 403 EMAIL_NOT_VERIFIED on signIn; cleared by
   * a successful signIn, signOut, or `clearPendingVerification`.
   */
  pendingVerificationEmail: string | null;
};

type AuthActions = {
  /** Resolve the initial session from storage. Flips isReady to true when done. */
  bootstrap: () => Promise<void>;
  clearError: () => void;
  /** Sign in with email + password. Wipes local cache + outbox on success. */
  signIn: (email: string, password: string) => Promise<boolean>;
  /**
   * Sign up a brand-new account. Returns `true` when the verification email
   * was sent (i.e. `pendingVerificationEmail` is now set) — NOT when the user
   * is logged in. The user is logged in only after they click the link and
   * the verify-email page calls `authClient.verifyEmail`.
   */
  signUp: (email: string, password: string) => Promise<boolean>;
  /**
   * Drop the session + wipe local data. Runs a bounded best-effort final sync
   * first; pass `skipFinalSync` when the caller already ran (and reported on)
   * `finalSyncBeforeSignOut` itself.
   */
  signOut: (opts?: { skipFinalSync?: boolean }) => Promise<void>;
  /** Alias for signOut. */
  logout: () => Promise<void>;
  /**
   * Begin Telegram OIDC sign-in. Redirects the browser away to Telegram on
   * success (nothing else runs); only a failure to START the redirect comes
   * back and is surfaced as an error banner.
   */
  signInWithTelegram: () => Promise<void>;
  /**
   * Attach Telegram to the account the user is ALREADY signed into. Distinct
   * from `signInWithTelegram`, which for an email-registered user would mint a
   * second account with its own (empty) wallet — Telegram gives no email, so
   * better-auth cannot merge them by itself.
   */
  linkTelegram: () => Promise<void>;
  /**
   * Surface an OAuth failure carried back on the redirect URL (better-auth
   * 302-ит на SPA с `?error=<code>`, наш errorCallbackURL добавляет маркер
   * `?authError=` — см. shared/lib/auth/oauthReturn.ts). Без этого юзер после
   * неудачного Telegram-входа молча оказывается на логине. `code` — машинный
   * код better-auth (state_mismatch, issuer_missing, …), если он был в URL.
   */
  reportOAuthReturnError: (code: string | null) => void;
  /**
   * Re-send the verification email for the account stored in
   * `pendingVerificationEmail`. No-op if there is no pending email. Used by
   * the "check your inbox" view's "send again" button.
   */
  requestResendVerification: () => Promise<void>;
  /**
   * Drop `pendingVerificationEmail`. Used by the "change email" link in the
   * "check your inbox" view to return to the sign-up form.
   */
  clearPendingVerification: () => void;
};

function applyUser(set: (s: Partial<AuthState>) => void, user: AppUser | null) {
  if (!user) {
    set({ isLoggedIn: false, email: null, userId: null, role: null });
    Sentry.setUser(null);
    return;
  }
  set({
    isLoggedIn: true,
    email: user.email,
    userId: user.id,
    role: user.role,
  });
  // id only — email is PII (food diary).
  Sentry.setUser({ id: user.id });
}

function authFail(
  set: (s: Partial<AuthState>) => void,
  error: AuthError,
  op: 'auth.signIn' | 'auth.signUp' | 'auth.linkTelegram',
) {
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
  role: null,
  isReady: false,
  isLoading: false,
  error: null,
  errorKind: null,
  pendingVerificationEmail: null,

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
      // requireEmailVerification: better-auth returns HTTP 403 + code
      // EMAIL_NOT_VERIFIED (mapped to 'email_not_confirmed' by
      // classifyBetterAuthError) when an unverified user tries to signIn.
      // Match on the code, NOT bare status — origin/CSRF rejections are also
      // 403 and previously landed on this branch, showing CheckInbox for a
      // CORS failure.
      if (result.error.kind === 'auth' && result.error.code === 'email_not_confirmed') {
        set({
          isLoading: false,
          pendingVerificationEmail: email,
          error: defaultUserMessage(result.error),
          errorKind: result.error.kind,
        });
        return false;
      }
      authFail(set, result.error, 'auth.signIn');
      return false;
    }
    // Success — switch identities. Wipe Dexie + idb-keyval before applying the
    // new identity so user A's rows/drafts don't bleed into user B on the same
    // device (single-user-per-device invariant). BackupGate then pulls user
    // B's snapshot from the vault on its fresh mount.
    try {
      await wipeLocalData();
    } catch (e) {
      console.error('cache clear after signIn failed', e);
    }
    applyUser(set, result.user);
    // Re-arm the once-per-session 401 funnel — a fresh session should be able to
    // warn again if THIS one later expires.
    resetSessionExpired();
    set({ isLoading: false, pendingVerificationEmail: null });
    return true;
  },

  signUp: async (email, password) => {
    set({ isLoading: true, error: null, errorKind: null });
    const result = await authProvider.signUp(email, password);
    if (!result.ok) {
      authFail(set, result.error, 'auth.signUp');
      return false;
    }
    // Under requireEmailVerification the success case is "we sent a link";
    // there is no session yet. Stash the email so AuthScreen can show the
    // "check your inbox" branch — DO NOT applyUser here.
    set({
      isLoading: false,
      pendingVerificationEmail: result.email,
    });
    return true;
  },

  signInWithTelegram: async () => {
    set({ isLoading: true, error: null, errorKind: null });
    const res = await authProvider.signInWithOAuth('telegram', '/');
    // Success → the browser is navigating to Telegram; this line is only
    // reached if the redirect could not be started. Keep isLoading on in the
    // success case so the button stays busy until the page unloads.
    if (res && !res.ok) {
      authFail(set, res.error, 'auth.signIn');
    }
  },

  linkTelegram: async () => {
    set({ isLoading: true, error: null, errorKind: null });
    const res = await authProvider.linkOAuth('telegram', '/');
    // Успех → браузер уже уходит на Telegram. Сюда попадаем ТОЛЬКО когда редирект
    // не стартовал (провайдер не поднят на сервере → 404, сеть, истёкшая сессия).
    // ProfileDrawer, в отличие от AuthScreen, не рендерит error-баннер — без
    // тостера такой провал выглядит мёртвой кнопкой.
    if (res && !res.ok) {
      authFail(set, res.error, 'auth.linkTelegram');
      // 404 = genericOAuth-провайдер не зарегистрирован на бэкенде (нет
      // TELEGRAM_CLIENT_ID/SECRET в env) — «Не найдено» из общего словаря тут
      // бессмысленно для юзера.
      const message =
        res.error.kind === 'not_found'
          ? 'Привязка Telegram сейчас недоступна'
          : defaultUserMessage(res.error);
      toaster.error(message, { kind: res.error });
    }
  },

  signOut: async ({ skipFinalSync = false } = {}) => {
    // The final sync is bounded + never throws (finalSyncBeforeSignOut). Its
    // outcome is deliberately IGNORED here: an interactive caller (ProfileDrawer)
    // runs it itself, shows the "не удалось сохранить — всё равно выйти?" branch
    // and arrives with skipFinalSync, while the forced 401-funnel path has a dead
    // bearer and nothing to salvage. Either way a failure must not trap the user
    // in a session they asked to leave — we wipe regardless (unconditional-local
    // signOut).
    if (!skipFinalSync) await finalSyncBeforeSignOut();
    // Server revoke is best-effort — if the server is unreachable we still
    // want to drop the local session so the user isn't stuck logged-in over
    // wiped Dexie. Local wipe is the load-bearing step.
    try {
      await authProvider.signOut();
    } catch (e) {
      console.error('server signOut failed; proceeding locally', e);
    }
    try {
      await wipeLocalData();
    } catch (e) {
      console.error('cache clear during signOut failed', e);
    }
    // The cloud-sync consent flag lives in localStorage (Zustand persist), which
    // survives the Dexie / idb-keyval wipe. Reset it to the default (ON) so a
    // shared device doesn't leak user A's switch position to user B on next
    // sign-in (the same shared-device hazard the data wipe closes).
    useSyncPrefStore.getState().setSyncEnabled(true);
    applyUser(set, null);
    set({ pendingVerificationEmail: null });
    // applyUser(null) flips AuthGate → it unmounts App and with it the
    // Drawer/Modal managers, which can then never run their close animation /
    // `finishClose`. Drop every overlay instance now so nothing (e.g. the
    // ProfileDrawer this signOut was triggered from) orphans in its store.
    drawerStore.reset();
    modalStore.reset();
  },

  logout: async () => {
    await get().signOut();
  },

  reportOAuthReturnError: (code) => {
    Sentry.captureException(new Error(`OAuth return error: ${code ?? 'unknown'}`), {
      tags: { kind: 'auth', op: 'auth.oauthReturn', ...(code ? { code } : {}) },
    });
    const human = 'Не удалось войти через Telegram, попробуйте ещё раз';
    // Dev-суффикс с кодом better-auth — тот же приём, что у defaultUserMessage
    // (в прод-сборке только человеческий текст, код уходит в Sentry).
    set({
      error: import.meta.env.DEV && code ? `${human} [${code}]` : human,
      errorKind: 'auth',
    });
  },

  requestResendVerification: async () => {
    const email = get().pendingVerificationEmail;
    if (!email) return;
    const result = await authProvider.sendVerificationEmail(email);
    if (!result.ok) {
      // Resend failures are non-fatal — surface as a banner but keep the
      // pending state so the user can retry.
      authFail(set, result.error, 'auth.signUp');
    }
  },

  clearPendingVerification: () => set({ pendingVerificationEmail: null }),
}));

// Keep the store in sync with auth events (sign-in, sign-out, token refresh,
// user update). Anonymous sessions are filtered out inside the provider.
authProvider.onAuthChange((_event, user) => {
  applyUser(useAuthStore.setState, user);
});
