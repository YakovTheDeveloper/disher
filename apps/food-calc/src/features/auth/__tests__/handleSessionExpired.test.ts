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

import toaster from '@/shared/lib/toaster/toaster';
import type { ErrorKind } from '@/shared/lib/errors/classify';
import { handleSessionExpired, resetSessionExpired } from '../handleSessionExpired';

const mockWarning = vi.mocked(toaster.warning);

beforeEach(() => {
  signOut.mockReset();
  mockWarning.mockReset();
  resetSessionExpired();
});

describe('handleSessionExpired', () => {
  it('on a mid-session 401 warns once and signs out, returning true', () => {
    const handled = handleSessionExpired({ status: 401 });
    expect(handled).toBe(true);
    expect(mockWarning).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledOnce();
  });

  it('throttles: repeated 401s still return true but sign out only once', () => {
    expect(handleSessionExpired({ status: 401 })).toBe(true);
    expect(handleSessionExpired({ status: 401 })).toBe(true);
    expect(handleSessionExpired({ status: 401 })).toBe(true);
    expect(signOut).toHaveBeenCalledOnce();
    expect(mockWarning).toHaveBeenCalledOnce();
  });

  it('re-arms after resetSessionExpired (next successful sign-in)', () => {
    handleSessionExpired({ status: 401 });
    resetSessionExpired();
    handleSessionExpired({ status: 401 });
    expect(signOut).toHaveBeenCalledTimes(2);
  });

  it('ignores a 403 (forbidden ≠ expired session)', () => {
    expect(handleSessionExpired({ status: 403 })).toBe(false);
    expect(signOut).not.toHaveBeenCalled();
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
  });

  it('ignores a non-auth error (500)', () => {
    expect(handleSessionExpired({ status: 500 })).toBe(false);
    expect(signOut).not.toHaveBeenCalled();
  });
});
