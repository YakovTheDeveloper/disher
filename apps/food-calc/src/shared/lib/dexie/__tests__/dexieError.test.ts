import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// toaster pulls in the router (heavy) — stub it and assert on the calls.
vi.mock('@/shared/lib/toaster/toaster', () => ({
  default: { error: vi.fn(), warning: vi.fn(), success: vi.fn(), info: vi.fn(), notify: vi.fn() },
}));

import toaster from '@/shared/lib/toaster/toaster';
import {
  classifyDexieError,
  surfaceDexieError,
  setQuotaExceededHandler,
} from '../dexieError';

const mockError = vi.mocked(toaster.error);

beforeEach(() => {
  mockError.mockReset();
  setQuotaExceededHandler(null);
});

afterEach(() => {
  setQuotaExceededHandler(null);
});

describe('classifyDexieError', () => {
  it('classifies a QuotaExceededError as quota with a message', () => {
    const c = classifyDexieError({ name: 'QuotaExceededError' });
    expect(c.kind).toBe('quota');
    expect(c.message).toMatch(/место/i);
  });

  it('reads a wrapped QuotaExceededError off `.inner`', () => {
    // Dexie wraps the underlying DOMException; the real name sits on .inner.
    const c = classifyDexieError({ name: 'AbortError', inner: { name: 'QuotaExceededError' } });
    expect(c.kind).toBe('quota');
  });

  it('classifies IDB open failures as open_failure', () => {
    for (const name of ['InvalidStateError', 'VersionError', 'DatabaseClosedError', 'UnknownError', 'NotFoundError']) {
      expect(classifyDexieError({ name }).kind).toBe('open_failure');
    }
  });

  it('classifies anything else as other with an empty message', () => {
    const c = classifyDexieError(new Error('some domain error'));
    expect(c.kind).toBe('other');
    expect(c.message).toBe('');
  });
});

describe('surfaceDexieError', () => {
  it('toasts and returns the classification for quota', () => {
    const c = surfaceDexieError({ name: 'QuotaExceededError' });
    expect(c.kind).toBe('quota');
    expect(mockError).toHaveBeenCalledOnce();
    expect(mockError).toHaveBeenCalledWith(c.message);
  });

  it('toasts for open_failure', () => {
    surfaceDexieError({ name: 'VersionError' });
    expect(mockError).toHaveBeenCalledOnce();
  });

  it('does NOT toast for other (safeMutate already toasts generic errors)', () => {
    const c = surfaceDexieError(new Error('generic'));
    expect(c.kind).toBe('other');
    expect(mockError).not.toHaveBeenCalled();
  });

  it('trips the registered quota hook only for a quota failure', () => {
    const hook = vi.fn();
    setQuotaExceededHandler(hook);
    surfaceDexieError({ name: 'VersionError' });
    expect(hook).not.toHaveBeenCalled();
    surfaceDexieError({ name: 'QuotaExceededError' });
    expect(hook).toHaveBeenCalledOnce();
  });
});
