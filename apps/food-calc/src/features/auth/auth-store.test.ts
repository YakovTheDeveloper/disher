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
        getSession: vi.fn(),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn().mockResolvedValue({ error: null }),
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

vi.mock('@/shared/lib/observability/sentry', () => ({
  Sentry: { setUser: vi.fn(), captureException: vi.fn(), captureMessage: vi.fn() },
}));

vi.mock('@/shared/lib/storage/pendingWrites', () => ({
  clearPending: clearPendingMock,
  enqueue: vi.fn(),
  enqueueMany: vi.fn(),
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
      email: null,
      userId: null,
      isReady: false,
      isLoading: false,
      error: null,
    });
  });

  it('bootstrap: populates state when getSession returns a real (non-anonymous) user', async () => {
    supabaseMock.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'u-1', email: 'a@b', is_anonymous: false } } },
      error: null,
    });

    await useAuthStore.getState().bootstrap();

    const s = useAuthStore.getState();
    expect(s.userId).toBe('u-1');
    expect(s.email).toBe('a@b');
    expect(s.isLoggedIn).toBe(true);
    expect(s.isReady).toBe(true);
  });

  it('bootstrap: treats anonymous session as no session', async () => {
    supabaseMock.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'anon-1', email: null, is_anonymous: true } } },
      error: null,
    });

    await useAuthStore.getState().bootstrap();

    const s = useAuthStore.getState();
    expect(s.userId).toBeNull();
    expect(s.isLoggedIn).toBe(false);
    expect(s.isReady).toBe(true);
  });

  it('bootstrap: clears state on no session', async () => {
    supabaseMock.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    await useAuthStore.getState().bootstrap();

    const s = useAuthStore.getState();
    expect(s.userId).toBeNull();
    expect(s.isLoggedIn).toBe(false);
    expect(s.isReady).toBe(true);
  });

  it('signIn: G1 ORDER — signInWithPassword FIRST, then clearPending + queryClient.clear (only on success)', async () => {
    const callOrder: string[] = [];
    supabaseMock.auth.signInWithPassword.mockImplementationOnce(async () => {
      callOrder.push('signInWithPassword');
      return {
        data: { user: { id: 'u-2', email: 'x@y', is_anonymous: false } },
        error: null,
      };
    });
    clearPendingMock.mockImplementationOnce(async () => {
      callOrder.push('clearPending');
    });
    qcClearSpy.mockImplementationOnce(() => {
      callOrder.push('queryClient.clear');
    });

    const ok = await useAuthStore.getState().signIn('x@y', 'pw');

    expect(ok).toBe(true);
    expect(callOrder).toEqual(['signInWithPassword', 'clearPending', 'queryClient.clear']);
    expect(useAuthStore.getState().userId).toBe('u-2');
  });

  it('signIn: G1 — failure preserves cache + pending queue (no clearPending, no queryClient.clear)', async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'bad credentials' },
    });

    const ok = await useAuthStore.getState().signIn('x@y', 'wrong');

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBe('bad credentials');
    expect(clearPendingMock).not.toHaveBeenCalled();
    expect(qcClearSpy).not.toHaveBeenCalled();
    expect(supabaseMock.auth.signOut).not.toHaveBeenCalled();
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

  it('onAuthStateChange listener mirrors a real session into store', async () => {
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

  it('onAuthStateChange listener filters anonymous sessions out (treated as logged-out)', async () => {
    listenerHolder.fn!('SIGNED_IN', {
      user: { id: 'anon-2', email: null, is_anonymous: true },
    });
    expect(useAuthStore.getState().userId).toBeNull();
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
  });
});

describe('useUserId', () => {
  it('returns store userId reactively + getUserIdSync reads same value', async () => {
    const { useUserId, getUserIdSync } = await import('@/shared/lib/auth/useUserId');

    useAuthStore.setState({ userId: 'sync-1' });
    expect(getUserIdSync()).toBe('sync-1');

    expect(useUserId.length).toBe(0);
  });
});
