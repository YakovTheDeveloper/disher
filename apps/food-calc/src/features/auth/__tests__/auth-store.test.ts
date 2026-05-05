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
  sendVerificationEmail: vi.fn(),
  onAuthChange: vi.fn(() => () => {}),
  getCurrentUser: vi.fn(() => null),
};

vi.mock('@/shared/lib/auth/authProvider', () => ({
  authProvider: authProviderMock,
}));

vi.mock('@/shared/lib/dexie/schema', () => ({
  db: { transaction: vi.fn(async (_mode, _tables, fn) => fn()) },
  SYNCED_TABLES: [],
}));

vi.mock('@/entities/analytics', () => ({
  clearAnalyticsCache: vi.fn(),
}));

vi.mock('@/shared/lib/observability/sentry', () => ({
  Sentry: { setUser: vi.fn(), captureException: vi.fn() },
}));

// Import AFTER mocks so the module sees the stubbed authProvider during its
// top-level `authProvider.onAuthChange(...)` subscription.
const { useAuthStore } = await import('../auth-store');

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
  it('on 403 EMAIL_NOT_VERIFIED: sets pendingVerificationEmail and errorKind=auth', async () => {
    authProviderMock.signIn.mockResolvedValue({
      ok: false,
      error: { kind: 'auth', message: 'verify your email', status: 403, raw: null },
    });

    const ok = await useAuthStore.getState().signIn('a@b.com', 'password123');

    expect(ok).toBe(false);
    const s = useAuthStore.getState();
    expect(s.pendingVerificationEmail).toBe('a@b.com');
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
