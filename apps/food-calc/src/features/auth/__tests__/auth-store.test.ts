// Auth-store unit tests for the C2.1 contract:
//   - signUp success → pendingVerificationEmail set, isLoggedIn stays false,
//     applyUser is NOT called (no session yet).
//   - signIn 403 EMAIL_NOT_VERIFIED → pendingVerificationEmail set, errorKind=auth.
//   - signIn success → pendingVerificationEmail cleared.
//   - clearPendingVerification / signOut clear it.
//   - requestResendVerification calls authProvider.sendVerificationEmail
//     with the stored email.
//
// Mocks:
//   - `authProvider`: stub all methods so we can drive results from each test.
//   - `dexie/schema`: avoid touching IDB during signIn-success wipeLocalData.
//   - `entities/analytics`: clearAnalyticsCache no-op.
//   - `observability/sentry`: setUser/captureException no-op.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authProviderMock = {
  bootstrap: vi.fn(async () => null),
  getAccessToken: vi.fn(async () => null),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(async () => undefined),
  signInWithOAuth: vi.fn(async () => undefined),
  sendVerificationEmail: vi.fn(),
  onAuthChange: vi.fn(() => () => {}),
  getCurrentUser: vi.fn(() => null),
};

vi.mock('@/shared/lib/auth/authProvider', () => ({
  authProvider: authProviderMock,
}));

// Records the interleaving of the final sync vs the local wipe so a test can
// assert syncNow() runs (and completes) BEFORE Dexie is cleared.
const opOrder: string[] = [];

vi.mock('@/shared/lib/dexie/schema', () => ({
  db: {
    tables: [],
    transaction: vi.fn(
      async (_mode: unknown, _tables: unknown, fn: () => Promise<unknown>) => {
        opOrder.push('wipe');
        return fn();
      },
    ),
  },
}));

// Best-effort pre-wipe sync (fix #2). Spy records order + lets each test drive
// success/failure.
const syncNowMock = vi.fn(async (_opts?: { signal?: AbortSignal }) => {
  opOrder.push('sync');
});
vi.mock('@/shared/lib/snapshot', () => ({
  // Forward opts — the abort signal is what bounds the final pre-signOut sync.
  syncNow: (opts?: { signal?: AbortSignal }) => syncNowMock(opts),
}));

vi.mock('idb-keyval', () => ({
  clear: vi.fn(async () => {}),
}));

vi.mock('@/shared/lib/observability/sentry', () => ({
  Sentry: { setUser: vi.fn(), captureException: vi.fn() },
}));

// Import AFTER mocks so the module sees the stubbed authProvider during its
// top-level `authProvider.onAuthChange(...)` subscription.
const { useAuthStore, finalSyncBeforeSignOut } = await import('../auth-store');

function reset() {
  useAuthStore.setState({
    isLoggedIn: false,
    email: null,
    userId: null,
    isReady: false,
    isLoading: false,
    error: null,
    errorKind: null,
    pendingVerificationEmail: null,
  });
  for (const fn of Object.values(authProviderMock)) {
    if (typeof fn === 'function' && 'mockReset' in fn) (fn as ReturnType<typeof vi.fn>).mockReset();
  }
  authProviderMock.bootstrap.mockResolvedValue(null);
  authProviderMock.signOut.mockResolvedValue(undefined);
  authProviderMock.onAuthChange.mockReturnValue(() => {});
  authProviderMock.getCurrentUser.mockReturnValue(null);
  opOrder.length = 0;
  syncNowMock.mockReset();
  syncNowMock.mockImplementation(async () => {
    opOrder.push('sync');
  });
}

beforeEach(reset);
afterEach(reset);

describe('signUp under requireEmailVerification', () => {
  it('sets pendingVerificationEmail and does NOT log in', async () => {
    authProviderMock.signUp.mockResolvedValue({
      ok: true,
      pendingVerification: true,
      email: 'a@b.com',
    });

    const ok = await useAuthStore.getState().signUp('a@b.com', 'password123');

    expect(ok).toBe(true);
    const s = useAuthStore.getState();
    expect(s.pendingVerificationEmail).toBe('a@b.com');
    expect(s.isLoggedIn).toBe(false);
    expect(s.userId).toBeNull();
    expect(s.email).toBeNull();
    expect(s.isLoading).toBe(false);
  });

  it('on error: sets error/errorKind, leaves pendingVerificationEmail null', async () => {
    authProviderMock.signUp.mockResolvedValue({
      ok: false,
      error: { kind: 'validation', message: 'weak', status: 400, code: 'weak_password', raw: null },
    });

    const ok = await useAuthStore.getState().signUp('a@b.com', '123');

    expect(ok).toBe(false);
    const s = useAuthStore.getState();
    expect(s.pendingVerificationEmail).toBeNull();
    expect(s.errorKind).toBe('validation');
    expect(s.error).not.toBeNull();
  });
});

describe('signIn with requireEmailVerification', () => {
  it('on EMAIL_NOT_VERIFIED code: sets pendingVerificationEmail and errorKind=auth', async () => {
    authProviderMock.signIn.mockResolvedValue({
      ok: false,
      error: { kind: 'auth', message: 'verify your email', status: 403, code: 'email_not_confirmed', raw: null },
    });

    const ok = await useAuthStore.getState().signIn('a@b.com', 'password123');

    expect(ok).toBe(false);
    const s = useAuthStore.getState();
    expect(s.pendingVerificationEmail).toBe('a@b.com');
    expect(s.errorKind).toBe('auth');
    expect(s.isLoggedIn).toBe(false);
  });

  it('on bare 403 (no code, e.g. CORS/CSRF reject): does NOT set pendingVerificationEmail', async () => {
    authProviderMock.signIn.mockResolvedValue({
      ok: false,
      error: { kind: 'auth', message: 'Invalid origin', status: 403, raw: null },
    });

    const ok = await useAuthStore.getState().signIn('a@b.com', 'password123');

    expect(ok).toBe(false);
    const s = useAuthStore.getState();
    expect(s.pendingVerificationEmail).toBeNull();
    expect(s.errorKind).toBe('auth');
    expect(s.isLoggedIn).toBe(false);
  });

  it('on 401: classic invalid credentials, NO pendingVerificationEmail', async () => {
    authProviderMock.signIn.mockResolvedValue({
      ok: false,
      error: { kind: 'auth', message: 'bad password', status: 401, code: 'invalid_credentials', raw: null },
    });

    const ok = await useAuthStore.getState().signIn('a@b.com', 'wrong');

    expect(ok).toBe(false);
    const s = useAuthStore.getState();
    expect(s.pendingVerificationEmail).toBeNull();
    expect(s.errorKind).toBe('auth');
  });

  it('on success: clears pendingVerificationEmail, applies user', async () => {
    useAuthStore.setState({ pendingVerificationEmail: 'a@b.com' });
    authProviderMock.signIn.mockResolvedValue({
      ok: true,
      user: { id: 'uid-1', email: 'a@b.com' },
    });

    const ok = await useAuthStore.getState().signIn('a@b.com', 'password123');

    expect(ok).toBe(true);
    const s = useAuthStore.getState();
    expect(s.pendingVerificationEmail).toBeNull();
    expect(s.isLoggedIn).toBe(true);
    expect(s.userId).toBe('uid-1');
    expect(s.email).toBe('a@b.com');
  });
});

describe('clearPendingVerification', () => {
  it('drops the stored email', () => {
    useAuthStore.setState({ pendingVerificationEmail: 'a@b.com' });
    useAuthStore.getState().clearPendingVerification();
    expect(useAuthStore.getState().pendingVerificationEmail).toBeNull();
  });
});

describe('signOut', () => {
  it('clears pendingVerificationEmail along with the session', async () => {
    useAuthStore.setState({
      isLoggedIn: true,
      userId: 'uid-1',
      email: 'a@b.com',
      pendingVerificationEmail: 'a@b.com',
    });

    await useAuthStore.getState().signOut();

    const s = useAuthStore.getState();
    expect(s.pendingVerificationEmail).toBeNull();
    expect(s.isLoggedIn).toBe(false);
    expect(s.userId).toBeNull();
  });

  // Fix #2: signOut used to wipe Dexie without a final push, silently losing
  // any edits made since the last sync. It must now best-effort syncNow()
  // FIRST — before both the server revoke and the local wipe.
  it('runs a final sync BEFORE wiping local data', async () => {
    useAuthStore.setState({ isLoggedIn: true, userId: 'uid-1', email: 'a@b.com' });

    await useAuthStore.getState().signOut();

    expect(syncNowMock).toHaveBeenCalledOnce();
    // sync completes before the Dexie wipe (order, not just presence).
    expect(opOrder).toEqual(['sync', 'wipe']);
  });

  it('syncs before the server revoke (so the push is still authenticated)', async () => {
    const seq: string[] = [];
    syncNowMock.mockImplementation(async () => {
      opOrder.push('sync');
      seq.push('sync');
    });
    authProviderMock.signOut.mockImplementation(async () => {
      seq.push('revoke');
    });
    useAuthStore.setState({ isLoggedIn: true, userId: 'uid-1', email: 'a@b.com' });

    await useAuthStore.getState().signOut();

    expect(seq).toEqual(['sync', 'revoke']);
  });

  it('still wipes + logs out when the final sync fails (best-effort, proceed anyway)', async () => {
    syncNowMock.mockRejectedValue(
      Object.assign(new Error('push failed: 500'), { status: 500 }),
    );
    useAuthStore.setState({ isLoggedIn: true, userId: 'uid-1', email: 'a@b.com' });

    await useAuthStore.getState().signOut();

    // The sync threw, but the wipe still ran and the session was dropped.
    expect(opOrder).toEqual(['wipe']);
    const s = useAuthStore.getState();
    expect(s.isLoggedIn).toBe(false);
    expect(s.userId).toBeNull();
  });

  // The interactive path (ProfileDrawer → SignOutConfirmModal) runs the final
  // sync itself, so it can ASK before wiping when the push fails. It arrives with
  // skipFinalSync — a second sync here would be a duplicate round-trip.
  it('skips the final sync when the caller already ran it', async () => {
    useAuthStore.setState({ isLoggedIn: true, userId: 'uid-1', email: 'a@b.com' });

    await useAuthStore.getState().signOut({ skipFinalSync: true });

    expect(syncNowMock).not.toHaveBeenCalled();
    expect(opOrder).toEqual(['wipe']);
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
  });
});

// A hung server used to trap the user: signOut awaited an unbounded syncNow()
// (fetch has no default timeout, and the Web Lock wait is unbounded too), so the
// wipe never ran and the drawer sat there forever. finalSyncBeforeSignOut aborts
// and reports false instead.
describe('finalSyncBeforeSignOut', () => {
  it('gives up on a hung sync and reports failure instead of hanging', async () => {
    vi.useFakeTimers();
    syncNowMock.mockImplementation(
      (opts?: { signal?: AbortSignal }) =>
        new Promise((_res, rej) => {
          opts?.signal?.addEventListener('abort', () => rej(new Error('aborted')));
        }),
    );

    const pending = finalSyncBeforeSignOut();
    await vi.advanceTimersByTimeAsync(13_000);

    await expect(pending).resolves.toBe(false);
    vi.useRealTimers();
  });

  it('reports success when the sync lands', async () => {
    await expect(finalSyncBeforeSignOut()).resolves.toBe(true);
  });
});

describe('requestResendVerification', () => {
  it('calls authProvider.sendVerificationEmail with the stored email', async () => {
    useAuthStore.setState({ pendingVerificationEmail: 'a@b.com' });
    authProviderMock.sendVerificationEmail.mockResolvedValue({ ok: true });

    await useAuthStore.getState().requestResendVerification();

    expect(authProviderMock.sendVerificationEmail).toHaveBeenCalledWith('a@b.com');
  });

  it('no-op when pendingVerificationEmail is null', async () => {
    await useAuthStore.getState().requestResendVerification();
    expect(authProviderMock.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('on failure: surfaces error but keeps pendingVerificationEmail', async () => {
    useAuthStore.setState({ pendingVerificationEmail: 'a@b.com' });
    authProviderMock.sendVerificationEmail.mockResolvedValue({
      ok: false,
      error: { kind: 'rate_limit', message: 'slow down', status: 429, raw: null },
    });

    await useAuthStore.getState().requestResendVerification();

    const s = useAuthStore.getState();
    expect(s.pendingVerificationEmail).toBe('a@b.com');
    expect(s.errorKind).toBe('rate_limit');
  });
});
