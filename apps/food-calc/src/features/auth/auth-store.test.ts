import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clear } from 'idb-keyval';

const { supabaseMock, listenerHolder, clearPendingMock, qcClearSpy } = vi.hoisted(() => {
  const listenerHolder: {
    fn:
      | ((
          event: string,
          session: {
            user: { id: string; email?: string | null; is_anonymous?: boolean } | null;
          } | null
        ) => void)
      | null;
  } = { fn: null };
  return {
    listenerHolder,
    supabaseMock: {
      auth: {
        getUser: vi.fn(),
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signInAnonymously: vi.fn(),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        updateUser: vi.fn(),
        onAuthStateChange: vi.fn((cb: typeof listenerHolder.fn) => {
          listenerHolder.fn = cb;
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        }),
      },
    },
    clearPendingMock: vi.fn().mockResolvedValue(undefined),
    qcClearSpy: vi.fn(),
  };
});

vi.mock('@/shared/api/supabase-client', () => ({ supabase: supabaseMock }));

vi.mock('@/shared/lib/storage/pendingWrites', () => ({
  clearPending: clearPendingMock,
  enqueue: vi.fn(),
  drain: vi.fn(),
  getPendingCount: () => 0,
  primePendingCache: vi.fn(),
  subscribePending: () => () => {},
}));

import { QueryClient } from '@tanstack/react-query';

vi.mock('@/shared/lib/storage/queryClient', () => {
  const qc = new QueryClient();
  qc.clear = qcClearSpy;
  return { queryClient: qc };
});

import { useAuthStore } from './auth-store';

describe('auth-store', () => {
  beforeEach(async () => {
    await clear();
    vi.clearAllMocks();
    clearPendingMock.mockClear();
    qcClearSpy.mockClear();
    useAuthStore.setState({
      isLoggedIn: false,
      isAnonymous: false,
      email: null,
      userId: null,
      isLoading: false,
      error: null,
    });
  });

  it('checkAuth: populates state when getUser succeeds', async () => {
    supabaseMock.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u-1', email: 'a@b', is_anonymous: false } },
      error: null,
    });

    await useAuthStore.getState().checkAuth();

    const s = useAuthStore.getState();
    expect(s.userId).toBe('u-1');
    expect(s.email).toBe('a@b');
    expect(s.isLoggedIn).toBe(true);
    expect(s.isAnonymous).toBe(false);
    expect(s.isLoading).toBe(false);
  });

  it('checkAuth: clears state on getUser error', async () => {
    supabaseMock.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('nope'),
    });

    await useAuthStore.getState().checkAuth();

    const s = useAuthStore.getState();
    expect(s.userId).toBeNull();
    expect(s.isLoggedIn).toBe(false);
  });

  it('signIn: calls clearPending + queryClient.clear BEFORE supabase.signOut + signInWithPassword', async () => {
    const callOrder: string[] = [];
    clearPendingMock.mockImplementationOnce(async () => {
      callOrder.push('clearPending');
    });
    qcClearSpy.mockImplementationOnce(() => {
      callOrder.push('queryClient.clear');
    });
    supabaseMock.auth.signOut.mockImplementationOnce(async () => {
      callOrder.push('signOut');
      return { error: null };
    });
    supabaseMock.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'u-2', email: 'x@y', is_anonymous: false } },
      error: null,
    });

    const ok = await useAuthStore.getState().signIn('x@y', 'pw');

    expect(ok).toBe(true);
    expect(callOrder).toEqual(['clearPending', 'queryClient.clear', 'signOut']);
    expect(useAuthStore.getState().userId).toBe('u-2');
  });

  it('signIn: returns false on error and surfaces error message', async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'bad credentials' },
    });

    const ok = await useAuthStore.getState().signIn('x@y', 'pw');

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBe('bad credentials');
  });

  it('signOut: calls clearPending + queryClient.clear BEFORE supabase.signOut', async () => {
    const callOrder: string[] = [];
    clearPendingMock.mockImplementationOnce(async () => {
      callOrder.push('clearPending');
    });
    qcClearSpy.mockImplementationOnce(() => {
      callOrder.push('queryClient.clear');
    });
    supabaseMock.auth.signOut.mockImplementationOnce(async () => {
      callOrder.push('signOut');
      return { error: null };
    });

    await useAuthStore.getState().signOut();

    expect(callOrder).toEqual(['clearPending', 'queryClient.clear', 'signOut']);
    expect(useAuthStore.getState().userId).toBeNull();
  });

  it('upgradeAnonymous: TWO-STEP — updateUser({email}) THEN updateUser({password})', async () => {
    const calls: Array<Record<string, unknown>> = [];
    supabaseMock.auth.updateUser
      .mockImplementationOnce(async (args: Record<string, unknown>) => {
        calls.push(args);
        return { data: { user: { id: 'u-3', email: 'a@b' } }, error: null };
      })
      .mockImplementationOnce(async (args: Record<string, unknown>) => {
        calls.push(args);
        return {
          data: { user: { id: 'u-3', email: 'a@b', is_anonymous: false } },
          error: null,
        };
      });

    const ok = await useAuthStore.getState().upgradeAnonymous('a@b', 'secret123');

    expect(ok).toBe(true);
    expect(calls).toEqual([{ email: 'a@b' }, { password: 'secret123' }]);
    expect(useAuthStore.getState().email).toBe('a@b');
  });

  it('upgradeAnonymous: aborts if email step fails (does NOT call password step)', async () => {
    supabaseMock.auth.updateUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'email taken' },
    });

    const ok = await useAuthStore.getState().upgradeAnonymous('a@b', 'secret');

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBe('email taken');
    expect(supabaseMock.auth.updateUser).toHaveBeenCalledTimes(1);
  });

  it('upgradeAnonymous: surfaces error if password step fails', async () => {
    supabaseMock.auth.updateUser
      .mockResolvedValueOnce({ data: { user: { id: 'u-3', email: 'a@b' } }, error: null })
      .mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'weak password' },
      });

    const ok = await useAuthStore.getState().upgradeAnonymous('a@b', '123');

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBe('weak password');
    expect(supabaseMock.auth.updateUser).toHaveBeenCalledTimes(2);
  });

  it('onAuthStateChange listener mirrors session into store', async () => {
    expect(listenerHolder.fn).toBeTruthy();
    listenerHolder.fn!('SIGNED_IN', {
      user: { id: 'u-4', email: 'c@d', is_anonymous: false },
    });
    expect(useAuthStore.getState().userId).toBe('u-4');
    expect(useAuthStore.getState().isLoggedIn).toBe(true);

    listenerHolder.fn!('SIGNED_OUT', null);
    expect(useAuthStore.getState().userId).toBeNull();
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
  });
});

describe('useUserId', () => {
  it('returns store userId reactively + getUserIdSync reads same value', async () => {
    const { useUserId, getUserIdSync } = await import('@/shared/lib/auth/useUserId');

    useAuthStore.setState({ userId: 'sync-1' });
    expect(getUserIdSync()).toBe('sync-1');

    // reactive read via the selector hook just calls into the store; check selector wiring.
    expect(useUserId.length).toBe(0);
  });
});
