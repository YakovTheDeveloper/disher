// authProvider unit tests for the C2.1 contract:
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
  authClient: {
    signUp: { email: signUpEmailMock },
    sendVerificationEmail: sendVerificationEmailMock,
    signIn: { email: signInEmailMock, oauth2: signInOAuth2Mock },
    getSession: getSessionMock,
    signOut: signOutMock,
    $store: { atoms: { session: { subscribe: () => () => {} } } },
  },
}));

const { authProvider, probeSessionLiveness } = await import('../authProvider');

const LAST_USER_KEY = 'disher.lastUser';

beforeEach(() => {
  signUpEmailMock.mockReset();
  sendVerificationEmailMock.mockReset();
});

afterEach(() => {
  signUpEmailMock.mockReset();
  sendVerificationEmailMock.mockReset();
});

describe('authProvider.signUp', () => {
  it('returns pendingVerification:true when better-auth replies without error and without user (autoSignIn:false)', async () => {
    // Under requireEmailVerification + autoSignIn:false, better-auth returns
    // { token: null, user: undefined } for fresh signups. We must not key off
    // `user` — absence of `error` is the success signal.
    signUpEmailMock.mockResolvedValue({ data: { token: null }, error: null });

    const result = await authProvider.signUp('new@example.com', 'password123');

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

    const result = await authProvider.signUp('dup@example.com', 'password123');

    expect(result).toEqual({ ok: true, pendingVerification: true, email: 'dup@example.com' });
  });

  it('classifies PASSWORD_TOO_SHORT (400) as validation', async () => {
    signUpEmailMock.mockResolvedValue({
      data: null,
      error: { status: 400, message: 'Password too short', code: 'PASSWORD_TOO_SHORT' },
    });

    const result = await authProvider.signUp('a@b.com', '12');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('validation');
    if (result.error.kind !== 'validation') return;
    expect(result.error.code).toBe('weak_password');
    expect(result.error.status).toBe(400);
  });

  it('classifies thrown TypeError as network', async () => {
    signUpEmailMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await authProvider.signUp('a@b.com', 'password123');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('network');
  });
});

describe('authProvider.sendVerificationEmail', () => {
  it('forwards email + callbackURL and returns { ok:true } on success', async () => {
    sendVerificationEmailMock.mockResolvedValue({ data: { status: true }, error: null });

    const result = await authProvider.sendVerificationEmail('a@b.com');

    expect(result).toEqual({ ok: true });
    expect(sendVerificationEmailMock).toHaveBeenCalledWith({ email: 'a@b.com', callbackURL: '/' });
  });

  it('classifies 429 as rate_limit', async () => {
    sendVerificationEmailMock.mockResolvedValue({
      data: null,
      error: { status: 429, message: 'too many' },
    });

    const result = await authProvider.sendVerificationEmail('a@b.com');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('rate_limit');
  });
});

describe('authProvider.bootstrap', () => {
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

  // The session cookie is httpOnly: nothing local can tell us whether one
  // exists, so every boot must ask the server — including a fresh install.
  it('always asks the server, even with nothing cached locally', async () => {
    getSessionMock.mockResolvedValue({ data: null, error: null });

    const user = await authProvider.bootstrap();

    expect(user).toBeNull();
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to last-known user when getSession throws (network down)', async () => {
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u1', email: 'u1@example.com' }));
    getSessionMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const user = await authProvider.bootstrap();

    // Critical: an unreachable backend is NOT a revocation — the cookie may
    // still be perfectly valid, so keep the user in the app.
    expect(user).toEqual({ id: 'u1', email: 'u1@example.com', role: null });
    expect(localStorage.getItem(LAST_USER_KEY)).toBeTruthy();
  });

  it('returns null on network throw when no last-known user is cached', async () => {
    getSessionMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const user = await authProvider.bootstrap();

    expect(user).toBeNull();
  });

  it('wipes lastUser when server returns 401 (session revoked)', async () => {
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u1', email: 'u1@example.com' }));
    getSessionMock.mockResolvedValue({ data: null, error: { status: 401, message: 'Unauthorized' } });

    const user = await authProvider.bootstrap();

    expect(user).toBeNull();
    expect(localStorage.getItem(LAST_USER_KEY)).toBeNull();
  });

  // Fix #3: bootstrap used to log the user out on ANY getSession error. A fast
  // 5xx/429 in the boot window (deploy, pg-pool restart, proxy) is transient —
  // the app must boot local-first, exactly like a network throw. Only 401/403 is
  // a real revocation.
  it('falls back to last-known user on a 500 (transient, NOT a revoke)', async () => {
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u1', email: 'u1@example.com' }));
    getSessionMock.mockResolvedValue({ data: null, error: { status: 500, message: 'Bad Gateway' } });

    const user = await authProvider.bootstrap();

    expect(user).toEqual({ id: 'u1', email: 'u1@example.com', role: null });
    expect(localStorage.getItem(LAST_USER_KEY)).toBeTruthy();
  });

  it('keeps the user on a 429 (rate-limited, transient)', async () => {
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u2', email: 'u2@example.com' }));
    getSessionMock.mockResolvedValue({ data: null, error: { status: 429, message: 'Too Many Requests' } });

    const user = await authProvider.bootstrap();

    expect(user).toEqual({ id: 'u2', email: 'u2@example.com', role: null });
    expect(localStorage.getItem(LAST_USER_KEY)).toBeTruthy();
  });

  it('keeps the user on a status-less error shape (better-fetch surfaced a network error as {error})', async () => {
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u3', email: 'u3@example.com' }));
    getSessionMock.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });

    const user = await authProvider.bootstrap();

    expect(user).toEqual({ id: 'u3', email: 'u3@example.com', role: null });
    expect(localStorage.getItem(LAST_USER_KEY)).toBeTruthy();
  });

  it('wipes lastUser when server returns 403 (forbidden ≡ dead session)', async () => {
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u1', email: 'u1@example.com' }));
    getSessionMock.mockResolvedValue({ data: null, error: { status: 403, message: 'Forbidden' } });

    const user = await authProvider.bootstrap();

    expect(user).toBeNull();
    expect(localStorage.getItem(LAST_USER_KEY)).toBeNull();
  });

  it('wipes lastUser on a clean 200 with no user (server explicitly says: no session)', async () => {
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u1', email: 'u1@example.com' }));
    getSessionMock.mockResolvedValue({ data: null, error: null });

    const user = await authProvider.bootstrap();

    expect(user).toBeNull();
    expect(localStorage.getItem(LAST_USER_KEY)).toBeNull();
  });

  it('persists last-known user on successful bootstrap', async () => {
    getSessionMock.mockResolvedValue({
      data: { user: { id: 'u9', email: 'u9@example.com' } },
      error: null,
    });

    const user = await authProvider.bootstrap();

    expect(user).toEqual({ id: 'u9', email: 'u9@example.com', role: null });
    expect(localStorage.getItem(LAST_USER_KEY)).toBe(
      JSON.stringify({ id: 'u9', email: 'u9@example.com', role: null }),
    );
  });

  // The Telegram return leg is no longer special: the callback set the session
  // cookie, the browser brings it back, and bootstrap is an ordinary boot with
  // no marker to consume and nothing to capture.
  it('signs in a first-time Telegram user with nothing cached (return leg)', async () => {
    getSessionMock.mockResolvedValue({
      data: { user: { id: 'tg1', email: null } },
      error: null,
    });

    const user = await authProvider.bootstrap();

    expect(user).toEqual({ id: 'tg1', email: null, role: null });
    expect(localStorage.getItem(LAST_USER_KEY)).toBe(
      JSON.stringify({ id: 'tg1', email: null, role: null }),
    );
  });
});

describe('authProvider.signInWithOAuth', () => {
  beforeEach(() => {
    signInOAuth2Mock.mockReset();
  });

  it('leaves the success URL bare and marks the error URL with ?authError=', async () => {
    signInOAuth2Mock.mockResolvedValue({ data: null, error: null });

    await authProvider.signInWithOAuth('telegram', '/');

    expect(signInOAuth2Mock).toHaveBeenCalledWith({
      providerId: 'telegram',
      callbackURL: `${window.location.origin}/`,
      errorCallbackURL: `${window.location.origin}/?authError=telegram`,
    });
  });
});

describe('authProvider.signOut', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    signOutMock.mockReset();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('wipes lastUser even if the server revoke throws', async () => {
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: 'u1', email: 'u1@example.com' }));
    signOutMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await authProvider.signOut();

    expect(localStorage.getItem(LAST_USER_KEY)).toBeNull();
  });
});

// This is the function that decides whether a mid-session 401 costs the user their
// unsynced edits: handleSessionExpired signs out (and wipes Dexie) on 'dead' and on
// nothing else. Its three-way split is the whole safety property, so each branch is
// pinned here. The funnel's own tests mock this function out entirely — without
// these, not one of its branches would be executed by anything.
describe('probeSessionLiveness', () => {
  beforeEach(() => {
    getSessionMock.mockReset();
  });

  it('reads an explicit rejection (401/403) as dead', async () => {
    getSessionMock.mockResolvedValue({ data: null, error: { status: 401 } });
    await expect(probeSessionLiveness()).resolves.toBe('dead');

    getSessionMock.mockResolvedValue({ data: null, error: { status: 403 } });
    await expect(probeSessionLiveness()).resolves.toBe('dead');
  });

  it('reads a 200 with a user as alive', async () => {
    getSessionMock.mockResolvedValue({
      data: { user: { id: 'u1', email: 'u1@example.com' } },
      error: null,
    });
    await expect(probeSessionLiveness()).resolves.toBe('alive');
  });

  // The server answered and said "no session" — that IS a rejection, just a polite
  // one. Treating it as 'unknown' would leave a genuinely signed-out user stuck.
  it('reads a 200 with no user as dead', async () => {
    getSessionMock.mockResolvedValue({ data: null, error: null });
    await expect(probeSessionLiveness()).resolves.toBe('dead');
  });

  // Everything below must NOT read as a revocation. A 5xx from a mid-deploy backend
  // or a dead network is exactly the case the probe exists to distinguish — call it
  // 'dead' and we wipe the diary of a user whose session was never revoked.
  it('reads a 5xx as unknown, never dead', async () => {
    getSessionMock.mockResolvedValue({ data: null, error: { status: 500 } });
    await expect(probeSessionLiveness()).resolves.toBe('unknown');
  });

  it('reads an error with no status as unknown', async () => {
    getSessionMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(probeSessionLiveness()).resolves.toBe('unknown');
  });

  it('reads a thrown network failure as unknown', async () => {
    getSessionMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(probeSessionLiveness()).resolves.toBe('unknown');
  });

  it('reads a timeout abort as unknown', async () => {
    getSessionMock.mockRejectedValue(
      Object.assign(new Error('aborted'), { name: 'AbortError' }),
    );
    await expect(probeSessionLiveness()).resolves.toBe('unknown');
  });
});
