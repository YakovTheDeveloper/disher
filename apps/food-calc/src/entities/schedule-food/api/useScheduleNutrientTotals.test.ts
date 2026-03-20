import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── mocks ────────────────────────────────────────────────────────────────────

const mockUseScheduleFoods = vi.fn();
const mockUseDishItemsByDishIds = vi.fn();
const mockUseProductsByIds = vi.fn();

vi.mock('./queries', () => ({
  useScheduleFoods: (...args: unknown[]) => mockUseScheduleFoods(...args),
}));

vi.mock('@/entities/dish', () => ({
  useDishItemsByDishIds: (...args: unknown[]) => mockUseDishItemsByDishIds(...args),
}));

vi.mock('@/entities/product', () => ({
  useProductsByIds: (...args: unknown[]) => mockUseProductsByIds(...args),
}));

import { useScheduleNutrientTotals } from './useScheduleNutrientTotals';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Creates a Map mimicking Triplit RelationMany result */
function nutrientsMap(entries: Array<{ id: string; nutrientId: string; quantity: number; foodId: string }>) {
  const map = new Map<string, { id: string; nutrientId: string; quantity: number; foodId: string }>();
  for (const e of entries) map.set(e.id, e);
  return map;
}

function makeFood(
  id: string,
  nutrients: Array<{ id: string; nutrientId: string; quantity: number }>,
) {
  return {
    id,
    name: id,
    nutrients: nutrientsMap(nutrients.map((n) => ({ ...n, foodId: id }))),
  };
}

function makeScheduleFood(overrides: {
  id: string;
  type: 'food' | 'dish';
  quantity: number;
  foodId?: string;
  dishId?: string;
  date?: string;
}) {
  return {
    date: '2026-01-01',
    foodId: null,
    dishId: null,
    ...overrides,
  };
}

// ─── setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockUseScheduleFoods.mockReturnValue({ results: null });
  mockUseDishItemsByDishIds.mockReturnValue({ results: null });
  mockUseProductsByIds.mockReturnValue({ results: null });
});

// ─── tests ────────────────────────────────────────────────────────────────────

describe('useScheduleNutrientTotals', () => {
  it('returns empty totals when scheduleFoods is null (loading)', () => {
    const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
    expect(result.current.totals).toEqual({});
    expect(result.current.missingNutrientNames).toEqual([]);
  });

  it('returns empty totals when there are no schedule foods', () => {
    mockUseScheduleFoods.mockReturnValue({ results: [] });
    mockUseProductsByIds.mockReturnValue({ results: [] });

    const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
    expect(result.current.totals).toEqual({});
    expect(result.current.missingNutrientNames).toEqual([]);
  });

  it('calculates nutrients for a single food item', () => {
    const sf = makeScheduleFood({
      id: 'sf1',
      type: 'food',
      foodId: 'apple',
      quantity: 200,
    });

    // apple: 52 kcal per 100g, 0.3g fat per 100g
    const apple = makeFood('apple', [
      { id: 'fn1', nutrientId: 'kcal', quantity: 52 },
      { id: 'fn2', nutrientId: 'fat', quantity: 0.3 },
    ]);

    mockUseScheduleFoods.mockReturnValue({ results: [sf] });
    mockUseDishItemsByDishIds.mockReturnValue({ results: [] });
    mockUseProductsByIds.mockReturnValue({ results: [apple] });

    const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));

    // 200g → scale 2.0: 52*2=104, 0.3*2=0.6
    expect(result.current.totals.kcal).toBeCloseTo(104);
    expect(result.current.totals.fat).toBeCloseTo(0.6);
  });

  it('sums nutrients across multiple food items', () => {
    const sf1 = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'apple', quantity: 100 });
    const sf2 = makeScheduleFood({ id: 'sf2', type: 'food', foodId: 'banana', quantity: 100 });

    const apple = makeFood('apple', [{ id: 'fn1', nutrientId: 'kcal', quantity: 52 }]);
    const banana = makeFood('banana', [{ id: 'fn2', nutrientId: 'kcal', quantity: 89 }]);

    mockUseScheduleFoods.mockReturnValue({ results: [sf1, sf2] });
    mockUseDishItemsByDishIds.mockReturnValue({ results: [] });
    mockUseProductsByIds.mockReturnValue({ results: [apple, banana] });

    const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
    expect(result.current.totals.kcal).toBeCloseTo(141);
  });

  it('calculates nutrients for a dish schedule item', () => {
    const sf = makeScheduleFood({
      id: 'sf1',
      type: 'dish',
      dishId: 'salad',
      quantity: 300, // user wants 300g of salad
    });

    // Dish "salad" has 2 items: 100g apple + 200g banana = 300g base weight
    const dishItems = [
      { id: 'di1', dishId: 'salad', foodId: 'apple', quantity: 100 },
      { id: 'di2', dishId: 'salad', foodId: 'banana', quantity: 200 },
    ];

    const apple = makeFood('apple', [{ id: 'fn1', nutrientId: 'kcal', quantity: 52 }]);
    const banana = makeFood('banana', [{ id: 'fn2', nutrientId: 'kcal', quantity: 89 }]);

    mockUseScheduleFoods.mockReturnValue({ results: [sf] });
    mockUseDishItemsByDishIds.mockReturnValue({ results: dishItems });
    mockUseProductsByIds.mockReturnValue({ results: [apple, banana] });

    const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));

    // base: apple 100g→52kcal, banana 200g→178kcal = 230kcal for 300g base
    // userQuantity=300, baseWeight=300 → scale=1.0
    expect(result.current.totals.kcal).toBeCloseTo(230);
  });

  it('scales dish nutrients when userQuantity differs from base weight', () => {
    const sf = makeScheduleFood({
      id: 'sf1',
      type: 'dish',
      dishId: 'salad',
      quantity: 150, // half of the base 300g
    });

    const dishItems = [
      { id: 'di1', dishId: 'salad', foodId: 'apple', quantity: 100 },
      { id: 'di2', dishId: 'salad', foodId: 'banana', quantity: 200 },
    ];

    const apple = makeFood('apple', [{ id: 'fn1', nutrientId: 'kcal', quantity: 52 }]);
    const banana = makeFood('banana', [{ id: 'fn2', nutrientId: 'kcal', quantity: 89 }]);

    mockUseScheduleFoods.mockReturnValue({ results: [sf] });
    mockUseDishItemsByDishIds.mockReturnValue({ results: dishItems });
    mockUseProductsByIds.mockReturnValue({ results: [apple, banana] });

    const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));

    // base 230kcal, scale 150/300=0.5 → 115kcal
    expect(result.current.totals.kcal).toBeCloseTo(115);
  });

  it('handles mix of food and dish items', () => {
    const sfFood = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'apple', quantity: 100 });
    const sfDish = makeScheduleFood({ id: 'sf2', type: 'dish', dishId: 'salad', quantity: 200 });

    const dishItems = [
      { id: 'di1', dishId: 'salad', foodId: 'banana', quantity: 200 },
    ];

    const apple = makeFood('apple', [{ id: 'fn1', nutrientId: 'kcal', quantity: 52 }]);
    const banana = makeFood('banana', [{ id: 'fn2', nutrientId: 'kcal', quantity: 89 }]);

    mockUseScheduleFoods.mockReturnValue({ results: [sfFood, sfDish] });
    mockUseDishItemsByDishIds.mockReturnValue({ results: dishItems });
    mockUseProductsByIds.mockReturnValue({ results: [apple, banana] });

    const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));

    // food: apple 100g → 52kcal
    // dish: banana 200g base → 178kcal, user 200g → scale 1.0 → 178kcal
    // total: 230
    expect(result.current.totals.kcal).toBeCloseTo(230);
  });

  it('skips food items with no matching product', () => {
    const sf = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'missing', quantity: 100 });

    mockUseScheduleFoods.mockReturnValue({ results: [sf] });
    mockUseDishItemsByDishIds.mockReturnValue({ results: [] });
    mockUseProductsByIds.mockReturnValue({ results: [] }); // no match

    const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
    expect(result.current.totals).toEqual({});
    expect(result.current.missingNutrientNames).toEqual(['missing']);
  });

  it('handles food with empty nutrients map', () => {
    const sf = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'water', quantity: 250 });
    const water = makeFood('water', []); // no nutrients

    mockUseScheduleFoods.mockReturnValue({ results: [sf] });
    mockUseDishItemsByDishIds.mockReturnValue({ results: [] });
    mockUseProductsByIds.mockReturnValue({ results: [water] });

    const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
    expect(result.current.totals).toEqual({});
    expect(result.current.missingNutrientNames).toEqual(['water']);
  });

  it('handles food with nutrients=undefined (no Include or no relation data)', () => {
    const sf = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'broken', quantity: 100 });
    // Simulating a food object where nutrients relation was NOT included
    const brokenFood = { id: 'broken', name: 'broken', nutrients: undefined };

    mockUseScheduleFoods.mockReturnValue({ results: [sf] });
    mockUseDishItemsByDishIds.mockReturnValue({ results: [] });
    mockUseProductsByIds.mockReturnValue({ results: [brokenFood] });

    const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
    // Should not crash, just return empty
    expect(result.current.totals).toEqual({});
    expect(result.current.missingNutrientNames).toEqual(['broken']);
  });

  it('passes correct date to useScheduleFoods', () => {
    renderHook(() => useScheduleNutrientTotals('2026-03-15'));
    expect(mockUseScheduleFoods).toHaveBeenCalledWith('2026-03-15');
  });

  it('collects food IDs from both direct foods and dish items', () => {
    const sfFood = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'apple', quantity: 100 });
    const sfDish = makeScheduleFood({ id: 'sf2', type: 'dish', dishId: 'salad', quantity: 100 });

    const dishItems = [
      { id: 'di1', dishId: 'salad', foodId: 'banana', quantity: 100 },
    ];

    mockUseScheduleFoods.mockReturnValue({ results: [sfFood, sfDish] });
    mockUseDishItemsByDishIds.mockReturnValue({ results: dishItems });
    mockUseProductsByIds.mockReturnValue({ results: [] });

    renderHook(() => useScheduleNutrientTotals('2026-01-01'));

    // Should request both apple (from direct food) and banana (from dish item)
    const calledIds = mockUseProductsByIds.mock.calls.at(-1)?.[0] as string[];
    expect(calledIds).toContain('apple');
    expect(calledIds).toContain('banana');
  });
});
