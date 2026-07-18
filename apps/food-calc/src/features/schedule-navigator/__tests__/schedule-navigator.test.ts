import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseLiveQuery = vi.fn();
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: () => unknown, deps?: unknown[]) => mockUseLiveQuery(fn, deps),
}));

const keysMock = vi.fn();
const orderByMock = vi.fn();
vi.mock('@/shared/lib/dexie/schema', () => ({
  db: {
    schedule_foods: {
      orderBy: (...args: unknown[]) => orderByMock(...args),
    },
  },
}));

import { deriveFilledDates, useFilledDateKeys } from '../hooks';

beforeEach(() => {
  vi.clearAllMocks();
  keysMock.mockResolvedValue([]);
  orderByMock.mockReturnValue({ keys: keysMock });
});

describe('useFilledDateKeys', () => {
  it('subscribes once via db.schedule_foods.orderBy("date").keys()', async () => {
    mockUseLiveQuery.mockReturnValue(['01-05-2026']);
    renderHook(() => useFilledDateKeys());
    expect(mockUseLiveQuery).toHaveBeenCalledTimes(1);
    const factory = mockUseLiveQuery.mock.calls[0]?.[0] as () => Promise<unknown>;
    await factory();
    expect(orderByMock).toHaveBeenCalledWith('date');
  });

  it('dedupes the index keys in JS instead of asking Dexie for uniqueKeys()', async () => {
    // uniqueKeys() opens a `nextunique` cursor — WebKit throws UnknownError on
    // it and wedges the whole DB (dexie#1030/#1052). The hook must never call it.
    keysMock.mockResolvedValue(['01-05-2026', '01-05-2026', '03-05-2026']);
    renderHook(() => useFilledDateKeys());
    const factory = mockUseLiveQuery.mock.calls[0]?.[0] as () => Promise<unknown>;
    await expect(factory()).resolves.toEqual(['01-05-2026', '03-05-2026']);
    expect(orderByMock.mock.results[0]?.value).not.toHaveProperty('uniqueKeys');
  });

  it('returns undefined on the first tick (loading sentinel)', () => {
    mockUseLiveQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useFilledDateKeys());
    expect(result.current).toBeUndefined();
  });
});

describe('deriveFilledDates', () => {
  it('wraps keys into a Set', () => {
    const set = deriveFilledDates(['01-05-2026', '03-05-2026']);
    expect(set).toBeInstanceOf(Set);
    expect(set.has('01-05-2026')).toBe(true);
    expect(set.size).toBe(2);
  });

  it('returns an empty Set when keys are undefined', () => {
    const set = deriveFilledDates(undefined);
    expect(set.size).toBe(0);
  });
});
