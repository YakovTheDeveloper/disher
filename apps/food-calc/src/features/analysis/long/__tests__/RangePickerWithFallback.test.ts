import { describe, it, expect } from 'vitest';
import {
  RANGE_PRESETS,
  MIN_WINDOW_DAYS,
  MAX_WINDOW_DAYS,
  windowSpanDays,
  isValidWindow,
  rangeDayKeys,
  defaultRange,
} from '../RangePickerWithFallback';

describe('windowSpanDays', () => {
  it('counts whole days between the ends', () => {
    expect(windowSpanDays({ start: '2026-03-25', end: '2026-04-01' })).toBe(7);
    expect(windowSpanDays({ start: '2026-04-01', end: '2026-05-06' })).toBe(35);
  });

  it('returns NaN for an unparseable range', () => {
    expect(windowSpanDays({ start: 'nope', end: '2026-04-01' })).toBeNaN();
  });
});

describe('isValidWindow', () => {
  it('accepts spans of exactly 7 and exactly 35 days', () => {
    expect(isValidWindow({ start: '2026-03-25', end: '2026-04-01' })).toBe(true);
    expect(isValidWindow({ start: '2026-04-01', end: '2026-05-06' })).toBe(true);
  });

  it('rejects a span shorter than 7 days', () => {
    expect(isValidWindow({ start: '2026-03-26', end: '2026-04-01' })).toBe(false);
  });

  it('rejects a span longer than 35 days', () => {
    expect(isValidWindow({ start: '2026-03-01', end: '2026-04-10' })).toBe(false);
  });

  it('rejects an unparseable range', () => {
    expect(isValidWindow({ start: '', end: '' })).toBe(false);
  });

  it('every preset produces a valid window from any end date', () => {
    for (const p of RANGE_PRESETS) {
      expect(p).toBeGreaterThanOrEqual(MIN_WINDOW_DAYS);
      expect(p).toBeLessThanOrEqual(MAX_WINDOW_DAYS);
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
});
