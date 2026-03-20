import { describe, it, expect } from 'vitest';
import {
  calculateProductNutrients,
  calculateDishNutrients,
  sumNutrients,
  type NutrientEntry,
} from './nutrients';

// ─── calculateProductNutrients ───────────────────────────────────────────────

describe('calculateProductNutrients', () => {
  it('scales nutrients by quantity / 100', () => {
    const nutrients: NutrientEntry[] = [
      { nutrientId: 'kcal', quantity: 200 },
      { nutrientId: 'protein', quantity: 10 },
    ];
    const result = calculateProductNutrients(nutrients, 250);
    expect(result.kcal).toBeCloseTo(500);
    expect(result.protein).toBeCloseTo(25);
  });

  it('returns empty object for empty nutrients array', () => {
    expect(calculateProductNutrients([], 100)).toEqual({});
  });

  it('returns zeros when quantity is 0', () => {
    const nutrients: NutrientEntry[] = [{ nutrientId: 'kcal', quantity: 300 }];
    expect(calculateProductNutrients(nutrients, 0).kcal).toBe(0);
  });

  it('returns stored value as-is at 100g (scale = 1)', () => {
    const nutrients: NutrientEntry[] = [{ nutrientId: 'fat', quantity: 9 }];
    expect(calculateProductNutrients(nutrients, 100).fat).toBe(9);
  });

  it('accumulates duplicate nutrientIds in the same array', () => {
    const nutrients: NutrientEntry[] = [
      { nutrientId: 'kcal', quantity: 100 },
      { nutrientId: 'kcal', quantity: 50 },
    ];
    expect(calculateProductNutrients(nutrients, 100).kcal).toBe(150);
  });

  it('handles fractional quantities', () => {
    const nutrients: NutrientEntry[] = [{ nutrientId: 'vit', quantity: 1 }];
    // 33.3g → scale = 0.333
    expect(calculateProductNutrients(nutrients, 33.3).vit).toBeCloseTo(0.333);
  });
});

// ─── calculateDishNutrients ──────────────────────────────────────────────────

describe('calculateDishNutrients', () => {
  const productMap = new Map<string, NutrientEntry[]>([
    ['apple', [{ nutrientId: 'kcal', quantity: 52 }]],
    ['banana', [
      { nutrientId: 'kcal', quantity: 89 },
      { nutrientId: 'protein', quantity: 1.1 },
    ]],
  ]);

  it('sums nutrients across all dish items', () => {
    const items = [
      { foodId: 'apple', quantity: 100 },
      { foodId: 'banana', quantity: 100 },
    ];
    const result = calculateDishNutrients(items, productMap);
    expect(result.kcal).toBeCloseTo(141);
    expect(result.protein).toBeCloseTo(1.1);
  });

  it('skips items without a match in productMap', () => {
    const items = [
      { foodId: 'apple', quantity: 100 },
      { foodId: 'missing', quantity: 200 },
    ];
    const result = calculateDishNutrients(items, productMap);
    expect(result.kcal).toBeCloseTo(52);
    expect(result.protein).toBeUndefined();
  });

  it('scales totals by userQuantity / baseDishWeight', () => {
    // base = 200g apple → kcal = 104; eat 100g → scale 0.5 → kcal = 52
    const items = [{ foodId: 'apple', quantity: 200 }];
    const result = calculateDishNutrients(items, productMap, 100);
    expect(result.kcal).toBeCloseTo(52);
  });

  it('does not scale when userQuantity is undefined', () => {
    const items = [{ foodId: 'apple', quantity: 200 }];
    const result = calculateDishNutrients(items, productMap);
    expect(result.kcal).toBeCloseTo(104);
  });

  it('returns empty object for empty dish items list', () => {
    expect(calculateDishNutrients([], productMap)).toEqual({});
  });

  it('does not divide by zero when items are empty but userQuantity is given', () => {
    // baseDishWeight = 0 → guard prevents scaling
    const result = calculateDishNutrients([], productMap, 100);
    expect(result).toEqual({});
  });

  it('accumulates quantities from multiple items of different products', () => {
    const items = [
      { foodId: 'apple', quantity: 100 }, // kcal = 52
      { foodId: 'apple', quantity: 100 }, // kcal = 52
    ];
    const result = calculateDishNutrients(items, productMap);
    expect(result.kcal).toBeCloseTo(104);
  });
});

// ─── sumNutrients ────────────────────────────────────────────────────────────

describe('sumNutrients', () => {
  it('sums values from multiple totals objects', () => {
    const a = { kcal: 100, protein: 20 };
    const b = { kcal: 50, fat: 5 };
    const result = sumNutrients(a, b);
    expect(result.kcal).toBe(150);
    expect(result.protein).toBe(20);
    expect(result.fat).toBe(5);
  });

  it('returns empty object when called with no arguments', () => {
    expect(sumNutrients()).toEqual({});
  });

  it('returns equivalent object when called with one argument', () => {
    const a = { kcal: 200 };
    const result = sumNutrients(a);
    expect(result).toEqual({ kcal: 200 });
  });

  it('does not mutate input objects', () => {
    const a = { kcal: 100 };
    const b = { kcal: 50 };
    sumNutrients(a, b);
    expect(a.kcal).toBe(100);
    expect(b.kcal).toBe(50);
  });

  it('handles empty totals objects', () => {
    expect(sumNutrients({}, {}, {})).toEqual({});
  });

  it('sums three or more sources correctly', () => {
    const result = sumNutrients({ x: 1 }, { x: 2 }, { x: 3 });
    expect(result.x).toBe(6);
  });
});
