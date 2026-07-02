import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/toaster/toaster', () => ({
  default: { error: vi.fn(), warning: vi.fn(), success: vi.fn(), info: vi.fn(), notify: vi.fn() },
}));
vi.mock('@/shared/lib/snapshot', () => ({ syncNow: vi.fn() }));
vi.mock('@/features/auth/handleSessionExpired', () => ({ handleSessionExpired: vi.fn(() => false) }));

import toaster from '@/shared/lib/toaster/toaster';
import { syncNow } from '@/shared/lib/snapshot';
import { handleSessionExpired } from '@/features/auth/handleSessionExpired';
import { runSyncTracked } from '../runSync';
import { useSyncStatusStore } from '../sync-status-store';

const mockSync = vi.mocked(syncNow);
const mockSessionExpired = vi.mocked(handleSessionExpired);
const mockToastError = vi.mocked(toaster.error);
const mockToastNotify = vi.mocked(toaster.notify);

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: online });
}

beforeEach(() => {
  mockSync.mockReset();
  mockSessionExpired.mockReset().mockReturnValue(false);
  mockToastError.mockReset();
  mockToastNotify.mockReset();
  useSyncStatusStore.setState({ state: 'idle', lastError: null, refId: null });
  setOnline(true);
});

afterEach(() => {
  setOnline(true);
});

describe('runSyncTracked', () => {
  it('returns true and records synced on success', async () => {
    mockSync.mockResolvedValue(undefined);
    const ok = await runSyncTracked();
    expect(ok).toBe(true);
    expect(useSyncStatusStore.getState().state).toBe('synced');
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('on an online failure records failed and shows a retry-able error toast', async () => {
    mockSync.mockRejectedValue({ status: 500 });
    const ok = await runSyncTracked();
    expect(ok).toBe(false);
    expect(useSyncStatusStore.getState().state).toBe('failed');
    expect(mockToastError).toHaveBeenCalledOnce();
    const [message, opts] = mockToastError.mock.calls[0];
    expect(message).toBe('Не удалось сохранить в облако');
    expect(opts?.action?.label).toBe('Повторить');
  });

  it('on a mid-session 401 signs out via the funnel and shows no "не сохранено" toast', async () => {
    mockSync.mockRejectedValue({ status: 401 });
    mockSessionExpired.mockReturnValue(true);
    const ok = await runSyncTracked();
    expect(ok).toBe(false);
    expect(mockSessionExpired).toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('offline + user-initiated shows the quiet ambient note, not an error', async () => {
    setOnline(false);
    mockSync.mockRejectedValue(new TypeError('Failed to fetch'));
    const ok = await runSyncTracked({ surfaceToast: true });
    expect(ok).toBe(false);
    expect(mockToastError).not.toHaveBeenCalled();
    expect(mockToastNotify).toHaveBeenCalledOnce();
  });

  it('offline + automatic mount sync stays silent', async () => {
    setOnline(false);
    mockSync.mockRejectedValue(new TypeError('Failed to fetch'));
    const ok = await runSyncTracked();
    expect(ok).toBe(false);
    expect(mockToastError).not.toHaveBeenCalled();
    expect(mockToastNotify).not.toHaveBeenCalled();
  });
});
