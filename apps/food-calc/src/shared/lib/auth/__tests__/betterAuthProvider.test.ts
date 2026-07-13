// betterAuthProvider unit tests for the C2.1 contract:
//   - signUp under requireEmailVerification: returns
//     { ok: true, pendingVerification: true, email } when there is no error.
//     The server body has no `user` (autoSignIn:false), and we explicitly do
//     NOT touch cachedUser.
//   - signUp on validation error (400 PASSWORD_TOO_SHORT): { ok:false, kind:'validation' }.
//   - sendVerificationEmail: forwards the email + a callbackURL, returns
//     { ok: true } on success and { ok: false, error } on validation/rate-limit.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const signUpEmailMock = vi.fn();
const sendVerificationEmailMock = vi.fn();
const signInEmailMock = vi.fn();
const signInOAuth2Mock = vi.fn();
const getSessionMock = vi.fn();
const signOutMock = vi.fn();

vi.mock('../betterAuthClient', () => ({
  BEARER_KEY: 'disher.bearer',
  authClient: {
    signUp: { email: signUpEmailMock },
    sendVerificationEmail: sendVerificationEmailMock,
    signIn: { email: signInEmailMock, oauth2: signInOAuth2Mock },
    getSession: getSessionMock,
    signOut: signOutMock,
    $store: { atoms: { session: { subscribe: () => () => {} } } },
  },
}));

const { betterAuthProvider } = await import('../betterAuthProvider');

const BEARER_KEY = 'disher.bearer';
const LAST_USER_KEY = 'disher.lastUser';

beforeEach(() => {
  signUpEmailMock.mockReset();
  sendVerificationEmailMock.mockReset();
});

afterEach(() => {
  signUpEmailMock.mockReset();
  sendVerificationEmailMock.mockReset();
});

describe('betterAuthProvider.signUp', () => {
  it('returns pendingVerification:true when better-auth replies without error and without user (autoSignIn:false)', async () => {
    // Under requireEmailVerification + autoSignIn:false, better-auth returns
    // { token: null, user: undefined } for fresh signups. We must not key off
    // `user` — absence of `error` is the success signal.
    signUpEmailMock.mockResolvedValue({ data: { token: null }, error: null });

    const result = await betterAuthProvider.signUp('new@example.com', 'password123');

    expect(result).toEqual({ ok: true, pendingVerification: true, email: 'new@example.com' });
    expect(signUpEmailMock).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
      // name defaults to the email local-part — kept for backwards compat
      // with the better-auth required-field setting.
      name: 'new',
    });
  });

  it('returns pendingVerification:true on duplicate email (anti-enumeration: better-auth replies 200 too)', async () => {
    signUpEmailMock.mockResolvedValue({ data: { token: null }, error: null });

    const result = await betterAuthProvider.signUp('dup@example.com', 'password123');

    expect(result).toEqual({ ok: true, pendingVerification: true, email: 'dup@example.com' });
  });

  it('classifies PASSWORD_TOO_SHORT (400) as validation', async () => {
    signUpEmailMock.mockResolvedValue({
      data: null,
      error: { status: 400, message: 'Password too short', code: 'PASSWORD_TOO_SHORT' },
    });

    const result = await betterAuthProvider.signUp('a@b.com', '12');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('validation');
    if (result.error.kind !== 'validation') return;
    expect(result.error.code).toBe('weak_password');
    expect(result.error.status).toBe(400);
  });

  it('classifies thrown TypeError as network', async () => {
    signUpEmailMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await betterAuthProvider.signUp('a@b.com', 'password123');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('network');
  });
});

describe('betterAuthProvider.sendVerificationEmail', () => {
  it('forwards email + callbackURL and returns { ok:true } on success', async () => {
    sendVerificationEmailMock.mockResolvedValue({ data: { status: true }, error: null });

    const result = await betterAuthProvider.sendVerificationEmail('a@b.com');

    expect(result).toEqual({ ok: true });
    expect(sendVerificationEmailMock).toHaveBeenCalledWith({ email: 'a@b.com', callbackURL: '/' });
  });

  it('classifies 429 as rate_limit', async () => {
    sendVerificationEmailMock.mockResolvedValue({
      data: null,
      error: { status: 429, message: 'too many' },
    });

    const result = await betterAuthProvider.sendVerificationEmail('a@b.com');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('rate_limit');
  });
});

describe('betterAuthProvider.bootstrap', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    getSessionMock.mockReset();
    signInEmailMock.mockReset();
    signOutMock.mockReset();
    signOutMock.mockResolvedValue(undefined);
    // Silence the network-warn from the throw branch.
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns null without hitting the network when no bearer', async () => {
    const user = await betterAuthProvider.bootstrap();
    expect(user).toBeNull();
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it('falls back to last-known user when getSession throws (network down) — bearer survives', async () => {
    localStorage.setItem(BEARER_KEY, 'opaque-token');
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u1', email: 'u1@example.com' }));
    getSessionMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const user = await betterAuthProvider.bootstrap();

    expect(user).toEqual({ id: 'u1', email: 'u1@example.com', role: null });
    // Critical: do NOT wipe the bearer on a network throw — the session may
    // still be valid, the backend is just unreachable right now.
    expect(localStorage.getItem(BEARER_KEY)).toBe('opaque-token');
    expect(localStorage.getItem(LAST_USER_KEY)).toBeTruthy();
  });

  it('returns null on network throw when no last-known user is cached', async () => {
    localStorage.setItem(BEARER_KEY, 'opaque-token');
    getSessionMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const user = await betterAuthProvider.bootstrap();

    expect(user).toBeNull();
    expect(localStorage.getItem(BEARER_KEY)).toBe('opaque-token');
  });

  it('wipes bearer AND lastUser when server returns 401 (token revoked)', async () => {
    localStorage.setItem(BEARER_KEY, 'dead-token');
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u1', email: 'u1@example.com' }));
    getSessionMock.mockResolvedValue({ data: null, error: { status: 401, message: 'Unauthorized' } });

    const user = await betterAuthProvider.bootstrap();

    expect(user).toBeNull();
    expect(localStorage.getItem(BEARER_KEY)).toBeNull();
    expect(localStorage.getItem(LAST_USER_KEY)).toBeNull();
  });

  // Fix #3: bootstrap used to log the user out on ANY getSession error. A fast
  // 5xx/429 in the 1s boot window (deploy, pg-pool restart, proxy) is transient
  // — the token must survive and the app must boot local-first, exactly like a
  // network throw. Only 401/403 is a real revocation.
  it('keeps bearer + falls back to last-known user on a 500 (transient, NOT a revoke)', async () => {
    localStorage.setItem(BEARER_KEY, 'live-token');
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u1', email: 'u1@example.com' }));
    getSessionMock.mockResolvedValue({ data: null, error: { status: 500, message: 'Bad Gateway' } });

    const user = await betterAuthProvider.bootstrap();

    expect(user).toEqual({ id: 'u1', email: 'u1@example.com', role: null });
    expect(localStorage.getItem(BEARER_KEY)).toBe('live-token');
    expect(localStorage.getItem(LAST_USER_KEY)).toBeTruthy();
  });

  it('keeps bearer on a 429 (rate-limited, transient)', async () => {
    localStorage.setItem(BEARER_KEY, 'live-token');
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u2', email: 'u2@example.com' }));
    getSessionMock.mockResolvedValue({ data: null, error: { status: 429, message: 'Too Many Requests' } });

    const user = await betterAuthProvider.bootstrap();

    expect(user).toEqual({ id: 'u2', email: 'u2@example.com', role: null });
    expect(localStorage.getItem(BEARER_KEY)).toBe('live-token');
  });

  it('keeps bearer on a status-less error shape (better-fetch surfaced a network error as {error})', async () => {
    localStorage.setItem(BEARER_KEY, 'live-token');
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u3', email: 'u3@example.com' }));
    getSessionMock.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });

    const user = await betterAuthProvider.bootstrap();

    expect(user).toEqual({ id: 'u3', email: 'u3@example.com', role: null });
    expect(localStorage.getItem(BEARER_KEY)).toBe('live-token');
  });

  it('wipes bearer AND lastUser when server returns 403 (forbidden ≡ dead token)', async () => {
    localStorage.setItem(BEARER_KEY, 'dead-token');
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u1', email: 'u1@example.com' }));
    getSessionMock.mockResolvedValue({ data: null, error: { status: 403, message: 'Forbidden' } });

    const user = await betterAuthProvider.bootstrap();

    expect(user).toBeNull();
    expect(localStorage.getItem(BEARER_KEY)).toBeNull();
    expect(localStorage.getItem(LAST_USER_KEY)).toBeNull();
  });

  it('wipes bearer on a clean 200 with no user (server explicitly says: no session)', async () => {
    localStorage.setItem(BEARER_KEY, 'stale-token');
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u1', email: 'u1@example.com' }));
    getSessionMock.mockResolvedValue({ data: null, error: null });

    const user = await betterAuthProvider.bootstrap();

    expect(user).toBeNull();
    expect(localStorage.getItem(BEARER_KEY)).toBeNull();
    expect(localStorage.getItem(LAST_USER_KEY)).toBeNull();
  });

  it('persists last-known user on successful bootstrap', async () => {
    localStorage.setItem(BEARER_KEY, 'valid-token');
    getSessionMock.mockResolvedValue({
      data: { user: { id: 'u9', email: 'u9@example.com' } },
      error: null,
    });

    const user = await betterAuthProvider.bootstrap();

    expect(user).toEqual({ id: 'u9', email: 'u9@example.com', role: null });
    expect(localStorage.getItem(LAST_USER_KEY)).toBe(
      JSON.stringify({ id: 'u9', email: 'u9@example.com', role: null }),
    );
  });
});

// The Telegram callback mints the session as an api-origin cookie + a
// `set-auth-token` header on a 302 — invisible to JS. On a device with no
// bearer, bootstrap must see the `?oauth=` marker (set by signInWithOAuth on
// the callbackURL) and capture that cookie-session into the bearer slot
// instead of short-circuiting to logged-out.
describe('betterAuthProvider.bootstrap (OAuth return leg)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    getSessionMock.mockReset();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    warnSpy.mockRestore();
    window.history.replaceState(null, '', '/');
  });

  it('captures the cookie-session into the bearer slot and returns the user', async () => {
    window.history.replaceState(null, '', '/?oauth=telegram');
    getSessionMock.mockResolvedValue({
      data: {
        user: { id: 'tg1', email: null },
        session: { token: 'raw-session-token' },
      },
      error: null,
    });

    const user = await betterAuthProvider.bootstrap();

    expect(user).toEqual({ id: 'tg1', email: null, role: null });
    expect(localStorage.getItem(BEARER_KEY)).toBe('raw-session-token');
    expect(localStorage.getItem(LAST_USER_KEY)).toBe(
      JSON.stringify({ id: 'tg1', email: null, role: null }),
    );
    // Marker consumed — a reload must not re-run the capture.
    expect(window.location.search).toBe('');
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to logged-out when the return-leg session is absent (cookie missing/expired)', async () => {
    window.history.replaceState(null, '', '/?oauth=telegram');
    getSessionMock.mockResolvedValue({ data: null, error: null });

    const user = await betterAuthProvider.bootstrap();

    expect(user).toBeNull();
    expect(localStorage.getItem(BEARER_KEY)).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('falls back to logged-out when the return-leg getSession throws (network)', async () => {
    window.history.replaceState(null, '', '/?oauth=telegram');
    getSessionMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const user = await betterAuthProvider.bootstrap();

    expect(user).toBeNull();
    expect(localStorage.getItem(BEARER_KEY)).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('with an existing bearer: strips the marker but keeps the normal bootstrap path', async () => {
    window.history.replaceState(null, '', '/?oauth=telegram');
    localStorage.setItem(BEARER_KEY, 'existing-token');
    getSessionMock.mockResolvedValue({
      data: { user: { id: 'u1', email: 'u1@example.com' } },
      error: null,
    });

    const user = await betterAuthProvider.bootstrap();

    expect(user).toEqual({ id: 'u1', email: 'u1@example.com', role: null });
    expect(localStorage.getItem(BEARER_KEY)).toBe('existing-token');
    expect(window.location.search).toBe('');
  });

  it('without the marker: old short-circuit, no network call', async () => {
    const user = await betterAuthProvider.bootstrap();

    expect(user).toBeNull();
    expect(getSessionMock).not.toHaveBeenCalled();
  });
});

describe('betterAuthProvider.signInWithOAuth', () => {
  beforeEach(() => {
    signInOAuth2Mock.mockReset();
  });

  it('marks the success URL with ?oauth= and the error URL with ?authError=', async () => {
    signInOAuth2Mock.mockResolvedValue({ data: null, error: null });

    await betterAuthProvider.signInWithOAuth('telegram', '/');

    expect(signInOAuth2Mock).toHaveBeenCalledWith({
      providerId: 'telegram',
      callbackURL: `${window.location.origin}/?oauth=telegram`,
      errorCallbackURL: `${window.location.origin}/?authError=telegram`,
    });
  });
});

describe('betterAuthProvider.signOut', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    signOutMock.mockReset();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('wipes bearer + lastUser even if server revoke throws', async () => {
    localStorage.setItem(BEARER_KEY, 'tok');
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u1', email: 'u1@example.com' }));
    signOutMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await betterAuthProvider.signOut();

    expect(localStorage.getItem(BEARER_KEY)).toBeNull();
    expect(localStorage.getItem(LAST_USER_KEY)).toBeNull();
  });
});
