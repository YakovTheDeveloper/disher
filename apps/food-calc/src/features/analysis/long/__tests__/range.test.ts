import { describe, it, expect } from 'vitest';
import { addDays, format, startOfDay, subDays, parseISO } from 'date-fns';
import {
  RANGE_PRESETS,
  MIN_WINDOW_DAYS,
  MAX_WINDOW_DAYS,
  windowSpanDays,
  isValidWindow,
  endsInFuture,
  rangeDayKeys,
  defaultRange,
  toKey,
  formatWindowLabel,
} from '../range';

describe('windowSpanDays', () => {
  it('counts calendar days inclusive of both ends', () => {
    // 25-03 … 01-04 is 8 dates inclusive (difference 7, +1).
    expect(windowSpanDays({ start: '2026-03-25', end: '2026-04-01' })).toBe(8);
    expect(windowSpanDays({ start: '2026-04-01', end: '2026-05-05' })).toBe(35);
  });

  it('a one-date window is 1 day', () => {
    expect(windowSpanDays({ start: '2026-04-01', end: '2026-04-01' })).toBe(1);
  });

  it('returns NaN for an unparseable range', () => {
    expect(windowSpanDays({ start: 'nope', end: '2026-04-01' })).toBeNaN();
  });
});

describe('isValidWindow', () => {
  it('accepts a window of exactly 7 and exactly 35 days', () => {
    expect(isValidWindow({ start: '2026-03-26', end: '2026-04-01' })).toBe(true);
    expect(isValidWindow({ start: '2026-04-01', end: '2026-05-05' })).toBe(true);
  });

  it('rejects a window shorter than 7 days', () => {
    expect(isValidWindow({ start: '2026-03-27', end: '2026-04-01' })).toBe(false);
  });

  it('rejects a window longer than 35 days', () => {
    expect(isValidWindow({ start: '2026-03-01', end: '2026-04-05' })).toBe(false);
  });

  it('rejects an unparseable range', () => {
    expect(isValidWindow({ start: '', end: '' })).toBe(false);
  });

  it('every preset is inside the accepted bounds', () => {
    for (const p of RANGE_PRESETS) {
      expect(p).toBeGreaterThanOrEqual(MIN_WINDOW_DAYS);
      expect(p).toBeLessThanOrEqual(MAX_WINDOW_DAYS);
    }
  });
});

describe('preset windows', () => {
  // Regression guard for the «7 дней показывает 8 дней» off-by-one: a preset
  // chip for N days must produce a window that actually covers N dates.
  it('a preset for N days yields a window of exactly N inclusive days', () => {
    const end = parseISO('2026-05-15');
    for (const p of RANGE_PRESETS) {
      const range = { start: toKey(subDays(end, p - 1)), end: toKey(end) };
      expect(windowSpanDays(range)).toBe(p);
      expect(rangeDayKeys(range)).toHaveLength(p);
      expect(isValidWindow(range)).toBe(true);
    }
  });
});

describe('rangeDayKeys', () => {
  it('emits dd-MM-yyyy keys for every inclusive day', () => {
    const keys = rangeDayKeys({ start: '2026-03-25', end: '2026-04-01' });
    expect(keys).toHaveLength(8); // inclusive of both ends
    expect(keys[0]).toBe('25-03-2026');
    expect(keys[keys.length - 1]).toBe('01-04-2026');
  });

  it('key count equals windowSpanDays', () => {
    const range = { start: '2026-04-01', end: '2026-04-20' };
    expect(rangeDayKeys(range)).toHaveLength(windowSpanDays(range));
  });

  it('returns an empty array for an unparseable range', () => {
    expect(rangeDayKeys({ start: 'x', end: 'y' })).toEqual([]);
  });
});

describe('defaultRange', () => {
  it('spans a valid 14-day window', () => {
    const r = defaultRange();
    expect(windowSpanDays(r)).toBe(14);
    expect(isValidWindow(r)).toBe(true);
  });

  it('does not end in the future', () => {
    expect(endsInFuture(defaultRange())).toBe(false);
  });
});

describe('endsInFuture', () => {
  const key = (d: Date) => format(d, 'yyyy-MM-dd');
  const today = startOfDay(new Date());

  it('is false when the window ends today', () => {
    expect(endsInFuture({ start: '2020-01-01', end: key(today) })).toBe(false);
  });

  it('is false when the window ends in the past', () => {
    expect(endsInFuture({ start: '2020-01-01', end: key(subDays(today, 3)) })).toBe(false);
  });

  it('is true when the end sits one day ahead of today', () => {
    expect(endsInFuture({ start: '2020-01-01', end: key(addDays(today, 1)) })).toBe(true);
  });

  it('is false for an unparseable end', () => {
    expect(endsInFuture({ start: '2020-01-01', end: '' })).toBe(false);
  });
});

describe('formatWindowLabel', () => {
  it('collapses a window=1 (start === end) to the «· день» daily label', () => {
    expect(formatWindowLabel('2026-07-02', '2026-07-02')).toBe('2 июл. · день');
  });

  it('renders a multi-day window as a «d MMM — d MMM» range', () => {
    expect(formatWindowLabel('2026-07-02', '2026-07-08')).toBe('2 июл. — 8 июл.');
  });

  it('treats an identical ISO-timestamp window (server daily row) as daily', () => {
    const iso = '2026-07-02T12:00:00.000Z';
    expect(formatWindowLabel(iso, iso)).toBe('2 июл. · день');
  });

  it('returns «—» when either side is unparseable', () => {
    expect(formatWindowLabel('', '2026-07-02')).toBe('—');
  });
});
