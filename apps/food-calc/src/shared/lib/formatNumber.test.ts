import { describe, expect, it } from 'vitest';
import { formatAmount, formatPercent } from './formatNumber';

describe('formatAmount', () => {
  it('strips the trailing zero on integers', () => {
    expect(formatAmount(1.0)).toBe('1');
    expect(formatAmount(1)).toBe('1');
    expect(formatAmount(0)).toBe('0');
  });

  it('keeps a real fractional digit', () => {
    expect(formatAmount(1.5)).toBe('1.5');
    expect(formatAmount(1.50)).toBe('1.5');
  });

  it('rounds to one decimal by default', () => {
    expect(formatAmount(1.24)).toBe('1.2');
    expect(formatAmount(1.26)).toBe('1.3');
  });

  it('honours a custom maxDecimals and still trims', () => {
    expect(formatAmount(0.123, 2)).toBe('0.12');
    expect(formatAmount(1.0, 2)).toBe('1');
  });

  it('handles negatives', () => {
    expect(formatAmount(-1.0)).toBe('-1');
    expect(formatAmount(-1.5)).toBe('-1.5');
  });

  it('renders an em-dash for non-finite input', () => {
    expect(formatAmount(NaN)).toBe('—');
    expect(formatAmount(Infinity)).toBe('—');
    expect(formatAmount(-Infinity)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('tiny (<1, >0) → 2 decimals, trimmed', () => {
    expect(formatPercent(0.42)).toBe('0.42');
    expect(formatPercent(0.5)).toBe('0.5');
  });

  it('single-digit (<10) → 1 decimal, trimmed', () => {
    expect(formatPercent(5)).toBe('5');
    expect(formatPercent(5.5)).toBe('5.5');
  });

  it('≥10 → integer', () => {
    expect(formatPercent(47)).toBe('47');
    expect(formatPercent(47.6)).toBe('48');
  });

  it('zero → "0"', () => {
    expect(formatPercent(0)).toBe('0');
  });
});
