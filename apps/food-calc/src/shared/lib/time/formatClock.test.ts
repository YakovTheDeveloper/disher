import { describe, expect, it } from 'vitest';
import { formatClock, formatClockRange } from './formatClock';

describe('formatClock', () => {
  it('strips the hour leading zero, keeps two-digit minutes', () => {
    expect(formatClock('00:04')).toBe('0:04');
    expect(formatClock('02:34')).toBe('2:34');
    expect(formatClock('09:00')).toBe('9:00');
  });

  it('leaves two-digit hours and trailing minute zeros untouched', () => {
    expect(formatClock('10:00')).toBe('10:00');
    expect(formatClock('23:59')).toBe('23:59');
  });

  it('returns non-"HH:mm" input unchanged', () => {
    expect(formatClock('')).toBe('');
    expect(formatClock('now')).toBe('now');
  });
});

describe('formatClockRange', () => {
  it('renders a single time when start === end', () => {
    expect(formatClockRange('10:00', '10:00')).toBe('10:00');
    expect(formatClockRange('02:34', '02:34')).toBe('2:34');
  });

  it('joins a stripped from–to range', () => {
    expect(formatClockRange('02:34', '02:48')).toBe('2:34-2:48');
    expect(formatClockRange('00:04', '10:00')).toBe('0:04-10:00');
  });
});
