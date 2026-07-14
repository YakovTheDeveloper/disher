import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/toaster/toaster', () => ({
  default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn(), notify: vi.fn() },
}));

// The funnel calls useAuthStore.getState().signOut() — stub the store so no real
// better-auth/network is touched.
const signOut = vi.fn();
vi.mock('../auth-store', () => ({
  useAuthStore: { getState: () => ({ signOut }) },
}));

// The 401 is now a CLAIM to be checked, not a verdict: the funnel asks the server
// once more before it acts. That matters because acting is destructive — signOut
// wipes Dexie, and the final sync that would have rescued unsynced edits pushes
// into the very backend that just 401'd.
const probeSessionLiveness = vi.fn();
vi.mock('@/shared/lib/auth/authProvider', () => ({
  probeSessionLiveness: () => probeSessionLiveness(),
}));

import toaster from '@/shared/lib/toaster/toaster';
import type { ErrorKind } from '@/shared/lib/errors/classify';
import { handleSessionExpired, resetSessionExpired } from '../handleSessionExpired';

const mockWarning = vi.mocked(toaster.warning);

beforeEach(() => {
  signOut.mockReset();
  mockWarning.mockReset();
  probeSessionLiveness.mockReset();
  probeSessionLiveness.mockResolvedValue('dead');
  resetSessionExpired();
});

describe('handleSessionExpired', () => {
  it('on a CONFIRMED mid-session 401 warns once and signs out, returning true', async () => {
    const handled = handleSessionExpired({ status: 401 });
    expect(handled).toBe(true);

    await vi.waitFor(() => expect(signOut).toHaveBeenCalledOnce());
    expect(mockWarning).toHaveBeenCalledOnce();
    // The session is dead, so the final sync would push with a revoked cookie and
    // 401 again. Skipping it is what stops signOut from stalling on a doomed push.
    expect(signOut).toHaveBeenCalledWith({ skipFinalSync: true });
  });

  it('throttles: repeated 401s probe once and sign out once', async () => {
    expect(handleSessionExpired({ status: 401 })).toBe(true);
    expect(handleSessionExpired({ status: 401 })).toBe(true);
    expect(handleSessionExpired({ status: 401 })).toBe(true);

    await vi.waitFor(() => expect(signOut).toHaveBeenCalledOnce());
    expect(probeSessionLiveness).toHaveBeenCalledOnce();
    expect(mockWarning).toHaveBeenCalledOnce();
  });

  it('re-arms after resetSessionExpired (next successful sign-in)', async () => {
    handleSessionExpired({ status: 401 });
    await vi.waitFor(() => expect(signOut).toHaveBeenCalledOnce());

    resetSessionExpired();
    handleSessionExpired({ status: 401 });
    await vi.waitFor(() => expect(signOut).toHaveBeenCalledTimes(2));
  });

  // The whole point of the probe. A 401 from a sick proxy or a mid-deploy backend
  // is indistinguishable from a real revocation at the call site — and guessing
  // "revoked" costs the user every edit made since the last sync.
  it('does NOT sign out when the probe finds the session alive', async () => {
    probeSessionLiveness.mockResolvedValue('alive');

    expect(handleSessionExpired({ status: 401 })).toBe(true);
    await vi.waitFor(() => expect(mockWarning).toHaveBeenCalledOnce());

    expect(signOut).not.toHaveBeenCalled();
    // The server ANSWERED — claiming "нет связи" here would send the user chasing
    // a network problem that does not exist.
    expect(mockWarning.mock.calls[0][0]).not.toMatch(/нет связи/i);
  });

  it('does NOT sign out when the probe cannot reach the server', async () => {
    probeSessionLiveness.mockResolvedValue('unknown');

    expect(handleSessionExpired({ status: 401 })).toBe(true);
    await vi.waitFor(() => expect(mockWarning).toHaveBeenCalledOnce());

    expect(signOut).not.toHaveBeenCalled();
    expect(mockWarning.mock.calls[0][0]).toMatch(/нет связи/i);
  });

  // An unconfirmed 401 must leave the funnel ARMED, or the next one — the real
  // revocation — would be swallowed for the rest of the session.
  it('re-arms itself after an unconfirmed 401 so a later real expiry still fires', async () => {
    probeSessionLiveness.mockResolvedValue('unknown');
    handleSessionExpired({ status: 401 });
    await vi.waitFor(() => expect(mockWarning).toHaveBeenCalledOnce());
    expect(signOut).not.toHaveBeenCalled();

    probeSessionLiveness.mockResolvedValue('dead');
    handleSessionExpired({ status: 401 });
    await vi.waitFor(() => expect(signOut).toHaveBeenCalledOnce());

    expect(probeSessionLiveness).toHaveBeenCalledTimes(2);
  });

  it('ignores a 403 (forbidden ≠ expired session)', () => {
    expect(handleSessionExpired({ status: 403 })).toBe(false);
    expect(signOut).not.toHaveBeenCalled();
    expect(probeSessionLiveness).not.toHaveBeenCalled();
  });

  it('ignores a login-FORM 401 that carries a code (invalid_credentials)', () => {
    const formError: ErrorKind = {
      kind: 'auth',
      status: 401,
      code: 'invalid_credentials',
      message: 'bad',
      raw: {},
    };
    expect(handleSessionExpired(formError)).toBe(false);
    expect(signOut).not.toHaveBeenCalled();
    expect(probeSessionLiveness).not.toHaveBeenCalled();
  });

  it('ignores a non-auth error (500)', () => {
    expect(handleSessionExpired({ status: 500 })).toBe(false);
    expect(signOut).not.toHaveBeenCalled();
  });
});
