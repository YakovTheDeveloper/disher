import { describe, expect, it } from 'vitest';
import { formatAmount, formatPercent, formatNutrientMass, formatPctDisplay } from './formatNumber';

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

// Доктрина «не обмануть нулём, не шуметь десятыми» (2026-07-23, инцидент
// «курага: 0 г · 1 %»): сырой 0 — единственный честный ноль; след > 0 обязан
// быть виден («<0.1» / десятые <1 / «<1» ккал); дальше — целые без шума.
describe('formatNutrientMass', () => {
  it('raw zero → "0" (the only honest zero)', () => {
    expect(formatNutrientMass(0, 'г')).toBe('0');
    expect(formatNutrientMass(0, 'мг')).toBe('0');
    expect(formatNutrientMass(0, 'мкг')).toBe('0');
    expect(formatNutrientMass(0, 'ккал')).toBe('0');
  });

  it('trace below the render floor → "<0.1" (mass) / "<1" (kcal), never a fake "0"', () => {
    expect(formatNutrientMass(0.04, 'г')).toBe('<0.1');
    expect(formatNutrientMass(0.049, 'мг')).toBe('<0.1');
    expect(formatNutrientMass(0.01, 'мкг')).toBe('<0.1');
    expect(formatNutrientMass(0.4, 'ккал')).toBe('<1');
  });

  it('sub-1 values keep one decimal (курага: 0.4 г жиров → "0.4", не "0")', () => {
    expect(formatNutrientMass(0.4, 'г')).toBe('0.4');
    expect(formatNutrientMass(0.2, 'мг')).toBe('0.2');
    expect(formatNutrientMass(0.5, 'мкг')).toBe('0.5');
  });

  it('≥1 → integer (decimals here are noise; precision lives in the % column)', () => {
    expect(formatNutrientMass(5, 'г')).toBe('5');
    expect(formatNutrientMass(70.4, 'г')).toBe('70');
    expect(formatNutrientMass(21, 'мг')).toBe('21');
    expect(formatNutrientMass(188, 'мг')).toBe('188');
    expect(formatNutrientMass(237, 'ккал')).toBe('237');
  });

  it('non-finite → em-dash', () => {
    expect(formatNutrientMass(NaN, 'г')).toBe('—');
  });
});

describe('formatPctDisplay', () => {
  it('raw zero → "0" (витрина с гашением прячет слот сама, по pctRaw === 0)', () => {
    expect(formatPctDisplay(0)).toBe('0');
  });

  it('trace (0, 0.5) → "<1" — след нормы виден следом', () => {
    expect(formatPctDisplay(0.3)).toBe('<1');
    expect(formatPctDisplay(0.49)).toBe('<1');
  });

  it('≥0.5 → nearest integer (FDA %DV rule)', () => {
    expect(formatPctDisplay(0.6)).toBe('1');
    expect(formatPctDisplay(18)).toBe('18');
    expect(formatPctDisplay(139.6)).toBe('140');
  });

  it('non-finite → em-dash', () => {
    expect(formatPctDisplay(NaN)).toBe('—');
  });
});
