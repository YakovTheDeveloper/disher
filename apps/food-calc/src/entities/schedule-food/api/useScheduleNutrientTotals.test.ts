import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── mocks ────────────────────────────────────────────────────────────────────

const mockUseScheduleFoods = vi.fn();
const mockUseDishItemsByDishIds = vi.fn();
const mockUseNutrientsByFoodIds = vi.fn();

vi.mock('./queries', () => ({
  useScheduleFoods: (...args: unknown[]) => mockUseScheduleFoods(...args),
}));

vi.mock('@/entities/dish', () => ({
  useDishItemsByDishIds: (...args: unknown[]) => mockUseDishItemsByDishIds(...args),
}));

vi.mock('@/entities/product', () => ({
  useNutrientsByFoodIds: (...args: unknown[]) => mockUseNutrientsByFoodIds(...args),
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
  name?: string,
) {
  return {
    id,
    name: name ?? id,
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
  food?: { name: string };
  dish?: { name: string };
}) {
  return {
    date: '2026-01-01',
    foodId: null,
    dishId: null,
    ...overrides,
  };
}

function buildNutrientsMap(products: ReturnType<typeof makeFood>[] | null | undefined) {
  const map = new Map<string, Array<{ nutrientId: string; quantity: number }>>();
  if (!products) return map;
  for (const p of products) {
    if (!p.nutrients) continue;
    const entries: Array<{ nutrientId: string; quantity: number }> = [];
    for (const n of p.nutrients.values()) {
      entries.push({ nutrientId: n.nutrientId, quantity: n.quantity });
    }
    if (entries.length > 0) map.set(p.id, entries);
  }
  return map;
}

function setupMocks(opts: {
  scheduleFoods?: ReturnType<typeof makeScheduleFood>[] | null;
  dishItems?: Array<{ id: string; dishId: string; foodId: string; quantity: number }> | null;
  products?: ReturnType<typeof makeFood>[] | null;
  fetchingSchedule?: boolean;
  fetchingDishItems?: boolean;
}) {
  mockUseScheduleFoods.mockReturnValue({
    results: opts.scheduleFoods ?? null,
    fetching: opts.fetchingSchedule ?? false,
  });
  mockUseDishItemsByDishIds.mockReturnValue({
    results: opts.dishItems ?? null,
    fetching: opts.fetchingDishItems ?? false,
  });
  mockUseNutrientsByFoodIds.mockReturnValue(buildNutrientsMap(opts.products));
}

// ─── setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  setupMocks({});
});

// ─── tests ────────────────────────────────────────────────────────────────────

describe('useScheduleNutrientTotals', () => {
  // ─── Loading & empty states ─────────────────────────────────────────────────

  describe('loading states', () => {
    it('returns empty totals when scheduleFoods is null (loading)', () => {
      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals).toEqual({});
      expect(result.current.missingNutrientNames).toEqual([]);
    });

    it('returns isLoading=true when scheduleFoods is fetching', () => {
      setupMocks({ fetchingSchedule: true });
      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.isLoading).toBe(true);
    });

    it('returns isLoading=true when dish items are fetching', () => {
      setupMocks({ scheduleFoods: [], fetchingDishItems: true });
      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.isLoading).toBe(true);
    });

    it('returns isLoading=false when all fetches complete', () => {
      setupMocks({ scheduleFoods: [], dishItems: [] });
      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.isLoading).toBe(false);
    });

    it('returns empty totals when there are no schedule foods', () => {
      setupMocks({ scheduleFoods: [] });
      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals).toEqual({});
      expect(result.current.missingNutrientNames).toEqual([]);
    });
  });

  // ─── Query wiring ──────────────────────────────────────────────────────────

  describe('query wiring', () => {
    it('passes correct date to useScheduleFoods', () => {
      renderHook(() => useScheduleNutrientTotals('2026-03-15'));
      expect(mockUseScheduleFoods).toHaveBeenCalledWith('2026-03-15');
    });

    it('collects food IDs from both direct foods and dish items', () => {
      const sfFood = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'apple', quantity: 100 });
      const sfDish = makeScheduleFood({ id: 'sf2', type: 'dish', dishId: 'salad', quantity: 100 });

      setupMocks({
        scheduleFoods: [sfFood, sfDish],
        dishItems: [{ id: 'di1', dishId: 'salad', foodId: 'banana', quantity: 100 }],
      });

      renderHook(() => useScheduleNutrientTotals('2026-01-01'));

      const calledIds = mockUseNutrientsByFoodIds.mock.calls.at(-1)?.[0] as string[];
      expect(calledIds).toContain('apple');
      expect(calledIds).toContain('banana');
    });

    it('deduplicates food IDs when same product used in food and dish items', () => {
      const sfFood = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'apple', quantity: 100 });
      const sfDish = makeScheduleFood({ id: 'sf2', type: 'dish', dishId: 'salad', quantity: 100 });

      setupMocks({
        scheduleFoods: [sfFood, sfDish],
        dishItems: [{ id: 'di1', dishId: 'salad', foodId: 'apple', quantity: 50 }],
      });

      renderHook(() => useScheduleNutrientTotals('2026-01-01'));

      const calledIds = mockUseNutrientsByFoodIds.mock.calls.at(-1)?.[0] as string[];
      // apple appears once, not twice
      expect(calledIds.filter((id: string) => id === 'apple')).toHaveLength(1);
    });

    it('passes unique dish IDs to useDishItemsByDishIds', () => {
      const sf1 = makeScheduleFood({ id: 'sf1', type: 'dish', dishId: 'salad', quantity: 100 });
      const sf2 = makeScheduleFood({ id: 'sf2', type: 'dish', dishId: 'salad', quantity: 200 });
      const sf3 = makeScheduleFood({ id: 'sf3', type: 'dish', dishId: 'soup', quantity: 300 });

      setupMocks({
        scheduleFoods: [sf1, sf2, sf3],
        dishItems: [],
      });

      renderHook(() => useScheduleNutrientTotals('2026-01-01'));

      const calledDishIds = mockUseDishItemsByDishIds.mock.calls.at(-1)?.[0] as string[];
      expect(calledDishIds).toContain('salad');
      expect(calledDishIds).toContain('soup');
      expect(calledDishIds).toHaveLength(2);
    });

    it('skips food items with null foodId', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', quantity: 100 });
      // foodId defaults to null

      setupMocks({
        scheduleFoods: [sf],
        dishItems: [],
      });

      renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // should not crash and should not request any food IDs
      expect(result()).toEqual({ totals: {}, missingNutrientNames: [], isLoading: false });
    });
  });

  // ─── Single food item calculations ──────────────────────────────────────────

  describe('food item calculations', () => {
    it('calculates nutrients for a single food item', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'apple', quantity: 200 });
      const apple = makeFood('apple', [
        { id: 'fn1', nutrientId: 'kcal', quantity: 52 },
        { id: 'fn2', nutrientId: 'fat', quantity: 0.3 },
      ]);

      setupMocks({ scheduleFoods: [sf], dishItems: [], products: [apple] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));

      // 200g → scale 2.0: 52*2=104, 0.3*2=0.6
      expect(result.current.totals.kcal).toBeCloseTo(104);
      expect(result.current.totals.fat).toBeCloseTo(0.6);
      expect(result.current.missingNutrientNames).toEqual([]);
    });

    it('calculates nutrients for quantity < 100g', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'apple', quantity: 50 });
      const apple = makeFood('apple', [
        { id: 'fn1', nutrientId: 'kcal', quantity: 100 },
      ]);

      setupMocks({ scheduleFoods: [sf], dishItems: [], products: [apple] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // 50g → scale 0.5: 100*0.5=50
      expect(result.current.totals.kcal).toBeCloseTo(50);
    });

    it('sums nutrients across multiple food items', () => {
      const sf1 = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'apple', quantity: 100 });
      const sf2 = makeScheduleFood({ id: 'sf2', type: 'food', foodId: 'banana', quantity: 100 });

      const apple = makeFood('apple', [{ id: 'fn1', nutrientId: 'kcal', quantity: 52 }]);
      const banana = makeFood('banana', [{ id: 'fn2', nutrientId: 'kcal', quantity: 89 }]);

      setupMocks({ scheduleFoods: [sf1, sf2], dishItems: [], products: [apple, banana] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals.kcal).toBeCloseTo(141);
    });

    it('sums different nutrients from different food items', () => {
      const sf1 = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'apple', quantity: 100 });
      const sf2 = makeScheduleFood({ id: 'sf2', type: 'food', foodId: 'oil', quantity: 10 });

      const apple = makeFood('apple', [
        { id: 'fn1', nutrientId: 'kcal', quantity: 52 },
        { id: 'fn2', nutrientId: 'carbs', quantity: 14 },
      ]);
      const oil = makeFood('oil', [
        { id: 'fn3', nutrientId: 'kcal', quantity: 884 },
        { id: 'fn4', nutrientId: 'fat', quantity: 100 },
      ]);

      setupMocks({ scheduleFoods: [sf1, sf2], dishItems: [], products: [apple, oil] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // apple: kcal=52, carbs=14; oil 10g: kcal=88.4, fat=10
      expect(result.current.totals.kcal).toBeCloseTo(140.4);
      expect(result.current.totals.carbs).toBeCloseTo(14);
      expect(result.current.totals.fat).toBeCloseTo(10);
    });

    it('handles same product added twice at different quantities', () => {
      const sf1 = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'apple', quantity: 100 });
      const sf2 = makeScheduleFood({ id: 'sf2', type: 'food', foodId: 'apple', quantity: 150 });

      const apple = makeFood('apple', [
        { id: 'fn1', nutrientId: 'kcal', quantity: 52 },
      ]);

      setupMocks({ scheduleFoods: [sf1, sf2], dishItems: [], products: [apple] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // 100g → 52kcal, 150g → 78kcal, total → 130kcal
      expect(result.current.totals.kcal).toBeCloseTo(130);
    });
  });

  // ─── Dish calculations ──────────────────────────────────────────────────────

  describe('dish calculations', () => {
    it('calculates nutrients for a dish schedule item', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'dish', dishId: 'salad', quantity: 300 });

      const dishItems = [
        { id: 'di1', dishId: 'salad', foodId: 'apple', quantity: 100 },
        { id: 'di2', dishId: 'salad', foodId: 'banana', quantity: 200 },
      ];

      const apple = makeFood('apple', [{ id: 'fn1', nutrientId: 'kcal', quantity: 52 }]);
      const banana = makeFood('banana', [{ id: 'fn2', nutrientId: 'kcal', quantity: 89 }]);

      setupMocks({ scheduleFoods: [sf], dishItems, products: [apple, banana] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));

      // base: apple 100g→52kcal, banana 200g→178kcal = 230kcal for 300g base
      // userQuantity=300, baseWeight=300 → scale=1.0
      expect(result.current.totals.kcal).toBeCloseTo(230);
    });

    it('scales dish nutrients when userQuantity differs from base weight', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'dish', dishId: 'salad', quantity: 150 });

      const dishItems = [
        { id: 'di1', dishId: 'salad', foodId: 'apple', quantity: 100 },
        { id: 'di2', dishId: 'salad', foodId: 'banana', quantity: 200 },
      ];

      const apple = makeFood('apple', [{ id: 'fn1', nutrientId: 'kcal', quantity: 52 }]);
      const banana = makeFood('banana', [{ id: 'fn2', nutrientId: 'kcal', quantity: 89 }]);

      setupMocks({ scheduleFoods: [sf], dishItems, products: [apple, banana] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));

      // base 230kcal, scale 150/300=0.5 → 115kcal
      expect(result.current.totals.kcal).toBeCloseTo(115);
    });

    it('does not mix dish items from different dishes', () => {
      const sfA = makeScheduleFood({ id: 'sf1', type: 'dish', dishId: 'dishA', quantity: 100 });
      const sfB = makeScheduleFood({ id: 'sf2', type: 'dish', dishId: 'dishB', quantity: 100 });

      const dishItems = [
        { id: 'di1', dishId: 'dishA', foodId: 'apple', quantity: 100 },
        { id: 'di2', dishId: 'dishB', foodId: 'banana', quantity: 200 },
      ];

      const apple = makeFood('apple', [{ id: 'fn1', nutrientId: 'kcal', quantity: 50 }]);
      const banana = makeFood('banana', [{ id: 'fn2', nutrientId: 'kcal', quantity: 80 }]);

      setupMocks({ scheduleFoods: [sfA, sfB], dishItems, products: [apple, banana] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));

      // dishA: apple 100g → 50kcal, userQ=100, base=100, scale=1.0
      // dishB: banana 200g → 160kcal, userQ=100, base=200, scale=0.5 → 80kcal
      // total: 130kcal
      expect(result.current.totals.kcal).toBeCloseTo(130);
    });

    it('handles dish with no dish items found (empty dish)', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'dish', dishId: 'empty-dish', quantity: 100 });

      setupMocks({ scheduleFoods: [sf], dishItems: [] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // No dish items → no calculation → empty totals
      expect(result.current.totals).toEqual({});
    });
  });

  // ─── Mixed food + dish ─────────────────────────────────────────────────────

  describe('mixed food and dish items', () => {
    it('handles mix of food and dish items', () => {
      const sfFood = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'apple', quantity: 100 });
      const sfDish = makeScheduleFood({ id: 'sf2', type: 'dish', dishId: 'salad', quantity: 200 });

      const dishItems = [
        { id: 'di1', dishId: 'salad', foodId: 'banana', quantity: 200 },
      ];

      const apple = makeFood('apple', [{ id: 'fn1', nutrientId: 'kcal', quantity: 52 }]);
      const banana = makeFood('banana', [{ id: 'fn2', nutrientId: 'kcal', quantity: 89 }]);

      setupMocks({ scheduleFoods: [sfFood, sfDish], dishItems, products: [apple, banana] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));

      // food: apple 100g → 52kcal
      // dish: banana 200g base → 178kcal, user 200g → scale 1.0 → 178kcal
      // total: 230
      expect(result.current.totals.kcal).toBeCloseTo(230);
    });

    it('handles same product used as both standalone food and in a dish', () => {
      const sfFood = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'apple', quantity: 100 });
      const sfDish = makeScheduleFood({ id: 'sf2', type: 'dish', dishId: 'salad', quantity: 200 });

      const dishItems = [
        { id: 'di1', dishId: 'salad', foodId: 'apple', quantity: 200 }, // same product
      ];

      const apple = makeFood('apple', [{ id: 'fn1', nutrientId: 'kcal', quantity: 52 }]);

      setupMocks({ scheduleFoods: [sfFood, sfDish], dishItems, products: [apple] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));

      // food: apple 100g → 52kcal
      // dish: apple 200g base → 104kcal, user 200g → scale 1.0 → 104kcal
      // total: 156
      expect(result.current.totals.kcal).toBeCloseTo(156);
    });
  });

  // ─── Missing nutrients ──────────────────────────────────────────────────────

  describe('missing nutrients', () => {
    it('reports missing when product has no nutrients', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'missing-id', quantity: 100 });

      setupMocks({ scheduleFoods: [sf], dishItems: [] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals).toEqual({});
      expect(result.current.missingNutrientNames).toEqual(['missing-id']);
    });

    it('reports missing when food has empty nutrients map', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'water', quantity: 250 });
      const water = makeFood('water', []);

      setupMocks({ scheduleFoods: [sf], dishItems: [], products: [water] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals).toEqual({});
      expect(result.current.missingNutrientNames).toEqual(['water']);
    });

    it('reports missing when food.nutrients is undefined (no Include)', () => {
      const sf = makeScheduleFood({
        id: 'sf1',
        type: 'food',
        foodId: 'broken',
        quantity: 100,
        food: { name: 'Рожь молотая жареная' },
      });

      setupMocks({
        scheduleFoods: [sf],
        dishItems: [],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals).toEqual({});
      expect(result.current.missingNutrientNames).toEqual(['Рожь молотая жареная']);
    });

    it('uses food name from schedule food relation for missing nutrient report', () => {
      const sf = makeScheduleFood({
        id: 'sf1',
        type: 'food',
        foodId: 'rye',
        quantity: 100,
        food: { name: 'Рожь молотая жареная' },
      });

      setupMocks({ scheduleFoods: [sf], dishItems: [] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.missingNutrientNames).toEqual(['Рожь молотая жареная']);
    });

    it('falls back to food.name from schedule food relation for missing name', () => {
      const sf = makeScheduleFood({
        id: 'sf1',
        type: 'food',
        foodId: 'unknown-id',
        quantity: 100,
        food: { name: 'Продукт из расписания' },
      });

      setupMocks({ scheduleFoods: [sf], dishItems: [] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // Falls back to sf.food?.name
      expect(result.current.missingNutrientNames).toEqual(['Продукт из расписания']);
    });

    it('does not duplicate missing names for same product added twice', () => {
      const sf1 = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'water', quantity: 100 });
      const sf2 = makeScheduleFood({ id: 'sf2', type: 'food', foodId: 'water', quantity: 200 });
      const water = makeFood('water', []);

      setupMocks({ scheduleFoods: [sf1, sf2], dishItems: [], products: [water] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.missingNutrientNames).toEqual(['water']);
      expect(result.current.missingNutrientNames).toHaveLength(1);
    });

    it('reports dish as missing when one of its products has no nutrients', () => {
      const sf = makeScheduleFood({
        id: 'sf1',
        type: 'dish',
        dishId: 'salad',
        quantity: 300,
        dish: { name: 'Салат' },
      });

      const dishItems = [
        { id: 'di1', dishId: 'salad', foodId: 'apple', quantity: 100 },
        { id: 'di2', dishId: 'salad', foodId: 'water', quantity: 200 },
      ];

      const apple = makeFood('apple', [{ id: 'fn1', nutrientId: 'kcal', quantity: 52 }]);
      const water = makeFood('water', []); // no nutrients

      setupMocks({ scheduleFoods: [sf], dishItems, products: [apple, water] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.missingNutrientNames).toContain('Салат');
    });

    it('still calculates dish nutrients even when flagged as missing', () => {
      const sf = makeScheduleFood({
        id: 'sf1',
        type: 'dish',
        dishId: 'salad',
        quantity: 300,
        dish: { name: 'Салат' },
      });

      const dishItems = [
        { id: 'di1', dishId: 'salad', foodId: 'apple', quantity: 100 },
        { id: 'di2', dishId: 'salad', foodId: 'water', quantity: 200 },
      ];

      const apple = makeFood('apple', [{ id: 'fn1', nutrientId: 'kcal', quantity: 52 }]);
      const water = makeFood('water', []);

      setupMocks({ scheduleFoods: [sf], dishItems, products: [apple, water] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // Dish is flagged as missing but still calculated with available data
      // apple 100g → 52kcal base, scale 300/300=1.0 → 52kcal
      expect(result.current.totals.kcal).toBeCloseTo(52);
      expect(result.current.missingNutrientNames).toContain('Салат');
    });

    it('reports both missing foods and missing dish nutrients', () => {
      const sfFood = makeScheduleFood({
        id: 'sf1',
        type: 'food',
        foodId: 'rye',
        quantity: 100,
        food: { name: 'Рожь молотая жареная' },
      });
      const sfDish = makeScheduleFood({
        id: 'sf2',
        type: 'dish',
        dishId: 'salad',
        quantity: 100,
        dish: { name: 'Салат' },
      });

      const dishItems = [
        { id: 'di1', dishId: 'salad', foodId: 'water', quantity: 100 },
      ];

      setupMocks({
        scheduleFoods: [sfFood, sfDish],
        dishItems,
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.missingNutrientNames).toContain('Рожь молотая жареная');
      expect(result.current.missingNutrientNames).toContain('Салат');
    });
  });

  // ─── Edge cases ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles food with nutrients=null', () => {
      const sf = makeScheduleFood({
        id: 'sf1',
        type: 'food',
        foodId: 'broken',
        quantity: 100,
        food: { name: 'Broken' },
      });

      setupMocks({
        scheduleFoods: [sf],
        dishItems: [],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals).toEqual({});
      expect(result.current.missingNutrientNames).toEqual(['Broken']);
    });

    it('handles zero quantity food item (contributes 0 to totals)', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'apple', quantity: 0 });
      const apple = makeFood('apple', [{ id: 'fn1', nutrientId: 'kcal', quantity: 52 }]);

      setupMocks({ scheduleFoods: [sf], dishItems: [], products: [apple] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals.kcal).toBeCloseTo(0);
    });

    it('handles food with many different nutrients', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'complete', quantity: 100 });
      const complete = makeFood('complete', [
        { id: 'fn1', nutrientId: 'kcal', quantity: 250 },
        { id: 'fn2', nutrientId: 'protein', quantity: 20 },
        { id: 'fn3', nutrientId: 'fat', quantity: 10 },
        { id: 'fn4', nutrientId: 'carbs', quantity: 30 },
        { id: 'fn5', nutrientId: 'fiber', quantity: 5 },
        { id: 'fn6', nutrientId: 'sodium', quantity: 0.5 },
        { id: 'fn7', nutrientId: 'calcium', quantity: 0.1 },
      ]);

      setupMocks({ scheduleFoods: [sf], dishItems: [], products: [complete] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals.kcal).toBeCloseTo(250);
      expect(result.current.totals.protein).toBeCloseTo(20);
      expect(result.current.totals.fat).toBeCloseTo(10);
      expect(result.current.totals.carbs).toBeCloseTo(30);
      expect(result.current.totals.fiber).toBeCloseTo(5);
      expect(result.current.totals.sodium).toBeCloseTo(0.5);
      expect(result.current.totals.calcium).toBeCloseTo(0.1);
      expect(result.current.missingNutrientNames).toEqual([]);
    });

    it('reports missing when nutrients not in map (Dexie empty)', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', foodId: 'apple', quantity: 100, food: { name: 'Apple' } });

      setupMocks({ scheduleFoods: [sf], dishItems: [] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals).toEqual({});
      expect(result.current.missingNutrientNames).toEqual(['Apple']);
    });

    it('large schedule with many items calculates correctly', () => {
      const scheduleFoods = Array.from({ length: 10 }, (_, i) =>
        makeScheduleFood({ id: `sf${i}`, type: 'food', foodId: 'apple', quantity: 100 }),
      );
      const apple = makeFood('apple', [{ id: 'fn1', nutrientId: 'kcal', quantity: 52 }]);

      setupMocks({ scheduleFoods, dishItems: [], products: [apple] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // 10 × 52kcal = 520kcal
      expect(result.current.totals.kcal).toBeCloseTo(520);
    });
  });
});

// helper to get result outside of renderHook
function result() {
  const { result: r } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
  return r.current;
}
