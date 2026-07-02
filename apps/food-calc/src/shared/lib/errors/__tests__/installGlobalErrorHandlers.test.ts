import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/toaster/toaster', () => ({
  default: { error: vi.fn(), warning: vi.fn(), success: vi.fn(), info: vi.fn(), notify: vi.fn() },
}));

import toaster from '@/shared/lib/toaster/toaster';
import {
  handleGlobalError,
  installGlobalErrorHandlers,
  resetGlobalErrorHandlersForTest,
} from '../installGlobalErrorHandlers';

const mockError = vi.mocked(toaster.error);

beforeEach(() => {
  vi.useFakeTimers();
  // Base the clock above GLOBAL_MIN_GAP_MS so the very first toast isn't blocked
  // by the "now - lastToastAt(0) < 2000" global rate gap.
  vi.setSystemTime(100_000);
  mockError.mockReset();
  resetGlobalErrorHandlersForTest();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('handleGlobalError', () => {
  it('toasts an unexpected server error', () => {
    handleGlobalError({ status: 500 });
    expect(mockError).toHaveBeenCalledOnce();
  });

  it('does NOT toast a validation error (handled at call-site)', () => {
    handleGlobalError({ status: 422 });
    expect(mockError).not.toHaveBeenCalled();
  });

  it('dedupes the same kind+message inside the dedupe window', () => {
    handleGlobalError({ status: 500 });
    vi.advanceTimersByTime(2001); // clear the global rate gap…
    handleGlobalError({ status: 500 }); // …but still inside the 5s per-key dedupe
    expect(mockError).toHaveBeenCalledOnce();
  });

  it('rate-caps two distinct errors fired back-to-back', () => {
    handleGlobalError({ status: 500, statusText: 'A' });
    handleGlobalError({ status: 500, statusText: 'B' }); // < 2s global gap → dropped
    expect(mockError).toHaveBeenCalledOnce();
  });

  it('allows a fresh toast once the dedupe window fully elapses', () => {
    handleGlobalError({ status: 500 });
    vi.advanceTimersByTime(5001);
    handleGlobalError({ status: 500 });
    expect(mockError).toHaveBeenCalledTimes(2);
  });
});

describe('installGlobalErrorHandlers', () => {
  it('is idempotent and toasts a leaked unhandledrejection', () => {
    installGlobalErrorHandlers();
    installGlobalErrorHandlers(); // second call must not double-bind

    const event = new Event('unhandledrejection') as Event & { reason?: unknown };
    event.reason = { status: 500 };
    window.dispatchEvent(event);

    expect(mockError).toHaveBeenCalledOnce();
  });

  it('ignores a resource-load `error` event with no error object', () => {
    installGlobalErrorHandlers();
    window.dispatchEvent(new Event('error')); // ErrorEvent with no .error
    expect(mockError).not.toHaveBeenCalled();
  });
});
