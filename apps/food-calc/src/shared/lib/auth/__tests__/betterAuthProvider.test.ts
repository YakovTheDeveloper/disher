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

vi.mock('../betterAuthClient', () => ({
  BEARER_KEY: 'disher.bearer',
  authClient: {
    signUp: { email: signUpEmailMock },
    sendVerificationEmail: sendVerificationEmailMock,
    // The provider only references these in other code paths — stubs are fine.
    signIn: { email: vi.fn() },
    getSession: vi.fn(async () => ({ data: null, error: null })),
    signOut: vi.fn(async () => undefined),
    $store: { atoms: { session: { subscribe: () => () => {} } } },
  },
}));

const { betterAuthProvider } = await import('../betterAuthProvider');

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
