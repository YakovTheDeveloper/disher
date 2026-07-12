// @vitest-environment jsdom
// useAdminGate — the client admin gate's tri-state + retry:
//  • role==='admin' → true immediately, no probe;
//  • probe 'forbidden' → false (cached); probe 'admin' → true;
//  • a transient 'network-error' stays null (NOT cached) and retry() re-probes
//    so a network blip can't strand a real admin at null forever.
// auth-store + the probe api are mocked; each case uses a distinct userId so the
// module-level probe cache never bleeds between tests.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const auth = { userId: 'u0' as string | null, role: null as string | null };
vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: (selector: (s: typeof auth) => unknown) => selector(auth),
}));

const probeAdmin = vi.fn();
vi.mock('@/shared/lib/api/admin', () => ({
  probeAdmin: (...a: unknown[]) => probeAdmin(...a),
}));

import { useAdminGate } from './useIsAdmin';

beforeEach(() => {
  probeAdmin.mockReset();
  auth.userId = 'u0';
  auth.role = null;
});

describe('useAdminGate', () => {
  it('role="admin" resolves true immediately without probing', () => {
    auth.userId = 'u-role';
    auth.role = 'admin';
    const { result } = renderHook(() => useAdminGate());
    expect(result.current.isAdmin).toBe(true);
    expect(probeAdmin).not.toHaveBeenCalled();
  });

  it('logged out → false, no probe', () => {
    auth.userId = null;
    const { result } = renderHook(() => useAdminGate());
    expect(result.current.isAdmin).toBe(false);
    expect(probeAdmin).not.toHaveBeenCalled();
  });

  it('probe "forbidden" → false', async () => {
    auth.userId = 'u-forbidden';
    probeAdmin.mockResolvedValue('forbidden');
    const { result } = renderHook(() => useAdminGate());
    expect(result.current.isAdmin).toBeNull(); // undecided on first frame
    await waitFor(() => expect(result.current.isAdmin).toBe(false));
  });

  it('probe "admin" (env-admin, role="user") → true', async () => {
    auth.userId = 'u-envadmin';
    probeAdmin.mockResolvedValue('admin');
    const { result } = renderHook(() => useAdminGate());
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
  });

  it('transient "network-error" stays null and is NOT cached; retry() re-probes', async () => {
    auth.userId = 'u-net';
    probeAdmin.mockResolvedValueOnce('network-error').mockResolvedValueOnce('admin');
    const { result } = renderHook(() => useAdminGate());

    // First probe fails transiently — gate stays undecided (not locked to false).
    await waitFor(() => expect(probeAdmin).toHaveBeenCalledTimes(1));
    expect(result.current.isAdmin).toBeNull();

    // retry() forces a fresh probe (the miss was never cached) → resolves admin.
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    expect(probeAdmin).toHaveBeenCalledTimes(2);
  });
});
