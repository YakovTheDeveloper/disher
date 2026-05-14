import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseLiveQuery = vi.fn();
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: () => unknown, deps?: unknown[]) => mockUseLiveQuery(fn, deps),
}));

const orderByMock = vi.fn();
vi.mock('@/shared/lib/dexie/schema', () => ({
  db: {
    schedule_foods: {
      orderBy: (...args: unknown[]) => orderByMock(...args),
    },
  },
}));

import { deriveFilledDates, useFilledDateKeys } from '../hooks';
import { computePastFilledAsc, groupByMonth, parseKeys } from '../lib';

beforeEach(() => {
  vi.clearAllMocks();
  orderByMock.mockReturnValue({ uniqueKeys: vi.fn() });
});

describe('useFilledDateKeys', () => {
  it('subscribes once via db.schedule_foods.orderBy("date").uniqueKeys()', () => {
    mockUseLiveQuery.mockReturnValue(['01-05-2026']);
    renderHook(() => useFilledDateKeys());
    expect(mockUseLiveQuery).toHaveBeenCalledTimes(1);
    const factory = mockUseLiveQuery.mock.calls[0]?.[0] as () => unknown;
    factory();
    expect(orderByMock).toHaveBeenCalledWith('date');
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

describe('computePastFilledAsc', () => {
  it('strictly excludes yesterday (yesterday belongs to anchor block)', () => {
    const today = new Date(2026, 4, 14); // 14 May 2026
    const filledAsc = parseKeys([
      '13-05-2026', // yesterday → excluded
      '12-05-2026',
      '10-05-2026',
      '14-05-2026', // today → still excluded (isBefore(today, yesterday) === false)
    ]);
    const past = computePastFilledAsc(filledAsc, today);
    expect(past.map((d) => d.dateStr)).toEqual(['10-05-2026', '12-05-2026']);
  });

  it('returns empty when filledAsc is empty', () => {
    const today = new Date(2026, 4, 14);
    expect(computePastFilledAsc([], today)).toEqual([]);
  });

  it('keeps deep-past days even when far older than yesterday', () => {
    const today = new Date(2026, 4, 14);
    const filledAsc = parseKeys([
      '01-01-2024',
      '15-08-2025',
      '12-05-2026',
    ]);
    const past = computePastFilledAsc(filledAsc, today);
    expect(past).toHaveLength(3);
  });

  it('does not return future-filled days', () => {
    const today = new Date(2026, 4, 14);
    const filledAsc = parseKeys([
      '12-05-2026',
      '20-05-2026', // future
      '01-06-2026', // future
    ]);
    const past = computePastFilledAsc(filledAsc, today);
    expect(past.map((d) => d.dateStr)).toEqual(['12-05-2026']);
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

describe('integration: filled keys → past chips → groups', () => {
  it('typical week of usage yields one group with the right past days', () => {
    const today = new Date(2026, 4, 14);
    const keys = [
      '07-05-2026',
      '09-05-2026',
      '11-05-2026',
      '12-05-2026',
      '13-05-2026', // yesterday — excluded from past
      '14-05-2026', // today — excluded
    ];
    const past = computePastFilledAsc(parseKeys(keys), today);
    expect(past.map((d) => d.dateStr)).toEqual([
      '07-05-2026',
      '09-05-2026',
      '11-05-2026',
      '12-05-2026',
    ]);
    const groups = groupByMonth(past);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.items).toHaveLength(4);
  });

  it('crossing months yields two groups with correct order', () => {
    const today = new Date(2026, 4, 14);
    const keys = [
      '28-04-2026',
      '30-04-2026',
      '02-05-2026',
      '12-05-2026',
    ];
    const past = computePastFilledAsc(parseKeys(keys), today);
    const groups = groupByMonth(past);
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
});
