import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor, cleanup, act } from '@testing-library/react';

const { primePendingCacheMock, drainMock } = vi.hoisted(() => ({
  primePendingCacheMock: vi.fn().mockResolvedValue(undefined),
  drainMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/shared/lib/storage/pendingWrites', () => ({
  primePendingCache: primePendingCacheMock,
  drain: drainMock,
  enqueue: vi.fn(),
  clearPending: vi.fn(),
  getPendingCount: () => 0,
  subscribePending: () => () => {},
}));

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

vi.mock('@/shared/lib/observability/sentry', () => ({
  Sentry: { captureException: vi.fn(), captureMessage: vi.fn(), setUser: vi.fn() },
}));

// We mock the auth-store module so SyncBootstrap can be tested in isolation
// from Supabase. bootstrap is a no-op; the test drives isLoggedIn via setState.
const { mockedAuthStore } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { create } = require('zustand') as typeof import('zustand');
  type AuthMockState = {
    isLoggedIn: boolean;
    isReady: boolean;
    bootstrap: () => Promise<void>;
  };
  const store = create<AuthMockState>(() => ({
    isLoggedIn: false,
    isReady: false,
    bootstrap: vi.fn().mockResolvedValue(undefined),
  }));
  return { mockedAuthStore: store };
});

vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: mockedAuthStore,
}));

import { SyncProvider } from './SyncProvider';
const useAuthStore = mockedAuthStore;

function setLoggedIn(value: boolean) {
  act(() => {
    useAuthStore.setState({ isLoggedIn: value, isReady: true });
  });
}

describe('SyncProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    useAuthStore.setState({ isLoggedIn: false, isReady: false });
  });

  it('calls bootstrap on mount', async () => {
    render(
      <SyncProvider>
        <div />
      </SyncProvider>
    );
    await waitFor(() => {
      expect(useAuthStore.getState().bootstrap).toHaveBeenCalled();
    });
  });

  it('does NOT call primePendingCache or drain while logged out', async () => {
    render(
      <SyncProvider>
        <div />
      </SyncProvider>
    );
    // Give the bootstrap effect a chance to run.
    await new Promise((r) => setTimeout(r, 10));
    expect(primePendingCacheMock).not.toHaveBeenCalled();
    expect(drainMock).not.toHaveBeenCalled();
  });

  it('once logged in: primePendingCache → drain (in order)', async () => {
    const order: string[] = [];
    primePendingCacheMock.mockImplementationOnce(async () => {
      order.push('primePendingCache');
    });
    drainMock.mockImplementationOnce(async () => {
      order.push('drain');
    });

    render(
      <SyncProvider>
        <div />
      </SyncProvider>
    );

    setLoggedIn(true);

    await waitFor(() => {
      expect(order).toEqual(['primePendingCache', 'drain']);
    });
  });

  it('online event triggers drain only while logged in', async () => {
    render(
      <SyncProvider>
        <div />
      </SyncProvider>
    );

    // logged out → online event ignored
    window.dispatchEvent(new Event('online'));
    await new Promise((r) => setTimeout(r, 10));
    expect(drainMock).not.toHaveBeenCalled();

    // log in → boot drain fires
    setLoggedIn(true);
    await waitFor(() => expect(drainMock).toHaveBeenCalled());
    drainMock.mockClear();

    // logged in → online event triggers drain
    window.dispatchEvent(new Event('online'));
    await waitFor(() => expect(drainMock).toHaveBeenCalled());
  });

  it('visibilitychange (visible) triggers drain while logged in', async () => {
    render(
      <SyncProvider>
        <div />
      </SyncProvider>
    );
    setLoggedIn(true);
    await waitFor(() => expect(drainMock).toHaveBeenCalled());
    drainMock.mockClear();

    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await waitFor(() => expect(drainMock).toHaveBeenCalled());
  });

  it('visibilitychange (hidden) does NOT trigger drain', async () => {
    render(
      <SyncProvider>
        <div />
      </SyncProvider>
    );
    setLoggedIn(true);
    await waitFor(() => expect(drainMock).toHaveBeenCalled());
    drainMock.mockClear();

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((r) => setTimeout(r, 10));
    expect(drainMock).not.toHaveBeenCalled();
  });

  it('cleanup removes online + visibilitychange listeners', async () => {
    const { unmount } = render(
      <SyncProvider>
        <div />
      </SyncProvider>
    );
    setLoggedIn(true);
    await waitFor(() => expect(drainMock).toHaveBeenCalled());

    unmount();
    drainMock.mockClear();

    window.dispatchEvent(new Event('online'));
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((r) => setTimeout(r, 10));
    expect(drainMock).not.toHaveBeenCalled();
  });
});
