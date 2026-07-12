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
import { groupByMonth, parseKeys } from '../lib';

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

describe('parseKeys', () => {
  it('returns [] for undefined / empty input', () => {
    expect(parseKeys(undefined)).toEqual([]);
    expect(parseKeys([])).toEqual([]);
  });

  it('drops keys that do not parse to a valid date (guards format() downstream)', () => {
    // A single malformed key (empty string, stray ISO date, garbage) must not
    // survive as an Invalid Date — otherwise groupByMonth()/the calendar call
    // format() on it and throw "Invalid time value", crashing the drawer.
    const result = parseKeys(['01-05-2026', '', '2026-01-01', 'not-a-date', '03-05-2026']);
    expect(result.map((d) => d.dateStr)).toEqual(['01-05-2026', '03-05-2026']);
    // The survivors are safe to format (no throw).
    expect(() => groupByMonth(result)).not.toThrow();
  });

  it('parses dd-MM-yyyy and sorts ASC by real Date (not lexical)', () => {
    // Lexical order would put '31-01-2026' BEFORE '01-12-2025' ('31' < '01'
    // is false, but '01' < '31' would be true the other way) — wrong. Ours
    // sorts on real Date.getTime().
    const result = parseKeys(['31-01-2026', '01-12-2025', '15-06-2025']);
    expect(result.map((d) => d.dateStr)).toEqual([
      '15-06-2025',
      '01-12-2025',
      '31-01-2026',
    ]);
  });
});

describe('groupByMonth', () => {
  it('groups consecutive days by year-month, preserving input order', () => {
    const input = parseKeys([
      '03-04-2026',
      '15-04-2026',
      '02-05-2026',
      '10-05-2026',
    ]);
    const groups = groupByMonth(input);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.key).toBe('2026-04');
    expect(groups[0]?.items.map((d) => d.dateStr)).toEqual(['03-04-2026', '15-04-2026']);
    expect(groups[1]?.key).toBe('2026-05');
    expect(groups[1]?.items.map((d) => d.dateStr)).toEqual(['02-05-2026', '10-05-2026']);
  });

  it('returns empty array for empty input', () => {
    expect(groupByMonth([])).toEqual([]);
  });

  it('separates same-month-different-year into distinct groups', () => {
    const input = parseKeys(['10-05-2025', '12-05-2026']);
    const groups = groupByMonth(input);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.key).toBe('2025-05');
    expect(groups[1]?.key).toBe('2026-05');
  });

  it('does not collapse non-consecutive same-month groups (assumes pre-sorted input)', () => {
    // Contract: groupByMonth groups *consecutive* same-month items. If callers
    // pass unsorted input, the same month can appear twice. parseKeys() always
    // returns ASC-sorted output, so in practice this path is unreachable —
    // but we document the invariant explicitly.
    const unsorted = [
      { dateStr: '01-04-2026', date: new Date(2026, 3, 1) },
      { dateStr: '01-05-2026', date: new Date(2026, 4, 1) },
      { dateStr: '15-04-2026', date: new Date(2026, 3, 15) },
    ];
    const groups = groupByMonth(unsorted);
    expect(groups.map((g) => g.key)).toEqual(['2026-04', '2026-05', '2026-04']);
  });
});

// Since the Embla slider was dropped (2026-07-12) the navigator feeds *every*
// filled day into the month calendars — there is no past/anchor split any more.
// These cover that pipeline end to end: Dexie keys → parseKeys → groupByMonth.
describe('integration: filled keys → month groups', () => {
  it('keeps yesterday/today/tomorrow in the groups (no past-only filtering)', () => {
    const keys = [
      '07-05-2026',
      '12-05-2026',
      '13-05-2026', // yesterday
      '14-05-2026', // today
      '15-05-2026', // tomorrow
    ];
    const groups = groupByMonth(parseKeys(keys));
    expect(groups).toHaveLength(1);
    expect(groups[0]?.items.map((d) => d.dateStr)).toEqual(keys);
  });

  it('crossing months yields ascending groups (oldest → newest)', () => {
    const keys = ['02-05-2026', '28-04-2026', '12-05-2026', '30-04-2026'];
    const groups = groupByMonth(parseKeys(keys));
    expect(groups.map((g) => g.key)).toEqual(['2026-04', '2026-05']);
    expect(groups[0]?.items.map((d) => d.dateStr)).toEqual([
      '28-04-2026',
      '30-04-2026',
    ]);
    expect(groups[1]?.items.map((d) => d.dateStr)).toEqual([
      '02-05-2026',
      '12-05-2026',
    ]);
  });

  it('future-only days still render as their own month group', () => {
    const groups = groupByMonth(parseKeys(['20-05-2026', '01-06-2026']));
    expect(groups.map((g) => g.key)).toEqual(['2026-05', '2026-06']);
  });
});
