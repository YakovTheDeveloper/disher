import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';

const { supabaseMock, primePendingCacheMock, drainMock, getSessionResolvers } = vi.hoisted(() => {
  const getSessionResolvers: { resolve: (v: unknown) => void } = {
    resolve: () => {},
  };
  return {
    getSessionResolvers,
    supabaseMock: {
      auth: {
        getSession: vi.fn(),
        signInAnonymously: vi.fn().mockResolvedValue({ error: null }),
      },
    },
    primePendingCacheMock: vi.fn().mockResolvedValue(undefined),
    drainMock: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('@/shared/api/supabase-client', () => ({ supabase: supabaseMock }));
vi.mock('@/shared/lib/storage/pendingWrites', () => ({
  primePendingCache: primePendingCacheMock,
  drain: drainMock,
  enqueue: vi.fn(),
  clearPending: vi.fn(),
  getPendingCount: () => 0,
  subscribePending: () => () => {},
}));

// Pre-create a real PersistQueryClientProvider-friendly persister/queryClient.
import { QueryClient } from '@tanstack/react-query';
vi.mock('@/shared/lib/storage/queryClient', () => ({
  queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
}));

vi.mock('@/shared/lib/storage/persister', () => ({
  persister: {
    persistClient: vi.fn().mockResolvedValue(undefined),
    restoreClient: vi.fn().mockResolvedValue(undefined),
    removeClient: vi.fn().mockResolvedValue(undefined),
  },
  APP_VERSION: 'test-version',
}));

import { SyncProvider } from './SyncProvider';

describe('SyncProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('happy path: getSession → signInAnonymously (no session) → primePendingCache → drain (in order)', async () => {
    const order: string[] = [];
    supabaseMock.auth.getSession.mockImplementationOnce(async () => {
      order.push('getSession');
      return { data: { session: null } };
    });
    supabaseMock.auth.signInAnonymously.mockImplementationOnce(async () => {
      order.push('signInAnonymously');
      return { error: null };
    });
    primePendingCacheMock.mockImplementationOnce(async () => {
      order.push('primePendingCache');
    });
    drainMock.mockImplementationOnce(async () => {
      order.push('drain');
    });

    render(
      <SyncProvider>
        <div data-testid="child">child</div>
      </SyncProvider>
    );

    await waitFor(() => {
      expect(order).toEqual(['getSession', 'signInAnonymously', 'primePendingCache', 'drain']);
    });
  });

  it('with existing session: skips signInAnonymously', async () => {
    supabaseMock.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'existing' } } },
    });

    render(
      <SyncProvider>
        <div />
      </SyncProvider>
    );

    await waitFor(() => {
      expect(primePendingCacheMock).toHaveBeenCalled();
    });
    expect(supabaseMock.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('on signInAnonymously error: shows fallback UI, does NOT call primePendingCache/drain', async () => {
    supabaseMock.auth.getSession.mockResolvedValueOnce({ data: { session: null } });
    supabaseMock.auth.signInAnonymously.mockResolvedValueOnce({
      error: new Error('anon failed'),
    });

    const { findByText } = render(
      <SyncProvider>
        <div />
      </SyncProvider>
    );

    await findByText(/Failed to initialize sync/);
    expect(primePendingCacheMock).not.toHaveBeenCalled();
    expect(drainMock).not.toHaveBeenCalled();
  });

  it('online event triggers drain', async () => {
    supabaseMock.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'u' } } },
    });

    render(
      <SyncProvider>
        <div />
      </SyncProvider>
    );

    // Wait for boot sequence to complete (initial drain).
    await waitFor(() => {
      expect(drainMock).toHaveBeenCalled();
    });
    drainMock.mockClear();

    window.dispatchEvent(new Event('online'));
    await waitFor(() => {
      expect(drainMock).toHaveBeenCalled();
    });
  });

  it('visibilitychange (visible) triggers drain', async () => {
    supabaseMock.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'u' } } },
    });

    render(
      <SyncProvider>
        <div />
      </SyncProvider>
    );

    await waitFor(() => {
      expect(drainMock).toHaveBeenCalled();
    });
    drainMock.mockClear();

    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await waitFor(() => {
      expect(drainMock).toHaveBeenCalled();
    });
  });

  it('visibilitychange (hidden) does NOT trigger drain', async () => {
    supabaseMock.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'u' } } },
    });

    render(
      <SyncProvider>
        <div />
      </SyncProvider>
    );

    await waitFor(() => {
      expect(drainMock).toHaveBeenCalled();
    });
    drainMock.mockClear();

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    // Wait a microtask cycle then assert no drain.
    await new Promise((r) => setTimeout(r, 10));
    expect(drainMock).not.toHaveBeenCalled();
  });

  it('cleanup removes online + visibilitychange listeners', async () => {
    supabaseMock.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'u' } } },
    });

    const { unmount } = render(
      <SyncProvider>
        <div />
      </SyncProvider>
    );
    await waitFor(() => {
      expect(drainMock).toHaveBeenCalled();
    });

    unmount();
    drainMock.mockClear();

    window.dispatchEvent(new Event('online'));
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((r) => setTimeout(r, 10));
    expect(drainMock).not.toHaveBeenCalled();
  });

  // touch unused vars so noUnused linting is happy when refactoring
  it('test setup smoke', () => {
    expect(getSessionResolvers).toBeDefined();
  });
});
