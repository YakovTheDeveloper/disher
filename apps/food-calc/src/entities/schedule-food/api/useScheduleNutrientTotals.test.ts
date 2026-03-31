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

function makeScheduleFood(overrides: {
  id: string;
  type: 'food' | 'dish';
  quantity: number;
  productId?: string;
  dishId?: string;
  date?: string;
}) {
  return {
    date: '2026-01-01',
    productId: overrides.productId ?? '',
    dishId: overrides.dishId ?? '',
    ...overrides,
  };
}

function buildNutrientsMap(
  products: Array<{ id: string; nutrients: Array<{ nutrientId: string; quantity: number }> }>,
) {
  const map = new Map<string, Array<{ nutrientId: string; quantity: number }>>();
  for (const p of products) {
    if (p.nutrients.length > 0) map.set(p.id, p.nutrients);
  }
  return map;
}

function setupMocks(opts: {
  scheduleFoods?: ReturnType<typeof makeScheduleFood>[];
  dishItems?: Array<{ id: string; dishId: string; productId: string; quantity: number }>;
  products?: Array<{ id: string; nutrients: Array<{ nutrientId: string; quantity: number }> }>;
}) {
  mockUseScheduleFoods.mockReturnValue(opts.scheduleFoods ?? []);
  mockUseDishItemsByDishIds.mockReturnValue(opts.dishItems ?? []);
  mockUseNutrientsByFoodIds.mockReturnValue(buildNutrientsMap(opts.products ?? []));
}

// ─── setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  setupMocks({});
});

// ─── tests ────────────────────────────────────────────────────────────────────

describe('useScheduleNutrientTotals', () => {
  describe('empty states', () => {
    it('returns empty totals when no schedule foods', () => {
      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals).toEqual({});
      expect(result.current.missingNutrientNames).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ─── Query wiring ──────────────────────────────────────────────────────────

  describe('query wiring', () => {
    it('passes correct date to useScheduleFoods', () => {
      renderHook(() => useScheduleNutrientTotals('2026-03-15'));
      expect(mockUseScheduleFoods).toHaveBeenCalledWith('2026-03-15');
    });

    it('collects food IDs from both direct foods and dish items', () => {
      const sfFood = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'apple', quantity: 100 });
      const sfDish = makeScheduleFood({ id: 'sf2', type: 'dish', dishId: 'salad', quantity: 100 });

      setupMocks({
        scheduleFoods: [sfFood, sfDish],
        dishItems: [{ id: 'di1', dishId: 'salad', productId: 'banana', quantity: 100 }],
      });

      renderHook(() => useScheduleNutrientTotals('2026-01-01'));

      const calledIds = mockUseNutrientsByFoodIds.mock.calls.at(-1)?.[0] as string[];
      expect(calledIds).toContain('apple');
      expect(calledIds).toContain('banana');
    });

    it('deduplicates food IDs when same product used in food and dish items', () => {
      const sfFood = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'apple', quantity: 100 });
      const sfDish = makeScheduleFood({ id: 'sf2', type: 'dish', dishId: 'salad', quantity: 100 });

      setupMocks({
        scheduleFoods: [sfFood, sfDish],
        dishItems: [{ id: 'di1', dishId: 'salad', productId: 'apple', quantity: 50 }],
      });

      renderHook(() => useScheduleNutrientTotals('2026-01-01'));

      const calledIds = mockUseNutrientsByFoodIds.mock.calls.at(-1)?.[0] as string[];
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

    it('skips food items with empty productId', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', quantity: 100 });

      setupMocks({ scheduleFoods: [sf], dishItems: [] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals).toEqual({});
      expect(result.current.missingNutrientNames).toEqual([]);
    });
  });

  // ─── Single food item calculations ──────────────────────────────────────────

  describe('food item calculations', () => {
    it('calculates nutrients for a single food item', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'apple', quantity: 200 });

      setupMocks({
        scheduleFoods: [sf],
        dishItems: [],
        products: [{ id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 52 }, { nutrientId: 'fat', quantity: 0.3 }] }],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));

      // 200g → scale 2.0: 52*2=104, 0.3*2=0.6
      expect(result.current.totals.kcal).toBeCloseTo(104);
      expect(result.current.totals.fat).toBeCloseTo(0.6);
      expect(result.current.missingNutrientNames).toEqual([]);
    });

    it('calculates nutrients for quantity < 100g', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'apple', quantity: 50 });

      setupMocks({
        scheduleFoods: [sf],
        dishItems: [],
        products: [{ id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 100 }] }],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals.kcal).toBeCloseTo(50);
    });

    it('sums nutrients across multiple food items', () => {
      const sf1 = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'apple', quantity: 100 });
      const sf2 = makeScheduleFood({ id: 'sf2', type: 'food', productId: 'banana', quantity: 100 });

      setupMocks({
        scheduleFoods: [sf1, sf2],
        dishItems: [],
        products: [
          { id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 52 }] },
          { id: 'banana', nutrients: [{ nutrientId: 'kcal', quantity: 89 }] },
        ],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals.kcal).toBeCloseTo(141);
    });

    it('sums different nutrients from different food items', () => {
      const sf1 = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'apple', quantity: 100 });
      const sf2 = makeScheduleFood({ id: 'sf2', type: 'food', productId: 'oil', quantity: 10 });

      setupMocks({
        scheduleFoods: [sf1, sf2],
        dishItems: [],
        products: [
          { id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 52 }, { nutrientId: 'carbs', quantity: 14 }] },
          { id: 'oil', nutrients: [{ nutrientId: 'kcal', quantity: 884 }, { nutrientId: 'fat', quantity: 100 }] },
        ],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals.kcal).toBeCloseTo(140.4);
      expect(result.current.totals.carbs).toBeCloseTo(14);
      expect(result.current.totals.fat).toBeCloseTo(10);
    });

    it('handles same product added twice at different quantities', () => {
      const sf1 = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'apple', quantity: 100 });
      const sf2 = makeScheduleFood({ id: 'sf2', type: 'food', productId: 'apple', quantity: 150 });

      setupMocks({
        scheduleFoods: [sf1, sf2],
        dishItems: [],
        products: [{ id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 52 }] }],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // 100g → 52kcal, 150g → 78kcal, total → 130kcal
      expect(result.current.totals.kcal).toBeCloseTo(130);
    });
  });

  // ─── Dish calculations ──────────────────────────────────────────────────────

  describe('dish calculations', () => {
    it('calculates nutrients for a dish schedule item', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'dish', dishId: 'salad', quantity: 300 });

      setupMocks({
        scheduleFoods: [sf],
        dishItems: [
          { id: 'di1', dishId: 'salad', productId: 'apple', quantity: 100 },
          { id: 'di2', dishId: 'salad', productId: 'banana', quantity: 200 },
        ],
        products: [
          { id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 52 }] },
          { id: 'banana', nutrients: [{ nutrientId: 'kcal', quantity: 89 }] },
        ],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // base: apple 100g→52kcal, banana 200g→178kcal = 230kcal for 300g base
      expect(result.current.totals.kcal).toBeCloseTo(230);
    });

    it('scales dish nutrients when userQuantity differs from base weight', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'dish', dishId: 'salad', quantity: 150 });

      setupMocks({
        scheduleFoods: [sf],
        dishItems: [
          { id: 'di1', dishId: 'salad', productId: 'apple', quantity: 100 },
          { id: 'di2', dishId: 'salad', productId: 'banana', quantity: 200 },
        ],
        products: [
          { id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 52 }] },
          { id: 'banana', nutrients: [{ nutrientId: 'kcal', quantity: 89 }] },
        ],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // base 230kcal, scale 150/300=0.5 → 115kcal
      expect(result.current.totals.kcal).toBeCloseTo(115);
    });

    it('does not mix dish items from different dishes', () => {
      const sfA = makeScheduleFood({ id: 'sf1', type: 'dish', dishId: 'dishA', quantity: 100 });
      const sfB = makeScheduleFood({ id: 'sf2', type: 'dish', dishId: 'dishB', quantity: 100 });

      setupMocks({
        scheduleFoods: [sfA, sfB],
        dishItems: [
          { id: 'di1', dishId: 'dishA', productId: 'apple', quantity: 100 },
          { id: 'di2', dishId: 'dishB', productId: 'banana', quantity: 200 },
        ],
        products: [
          { id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 50 }] },
          { id: 'banana', nutrients: [{ nutrientId: 'kcal', quantity: 80 }] },
        ],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // dishA: apple 100g → 50kcal, scale=1.0
      // dishB: banana 200g → 160kcal, userQ=100, base=200, scale=0.5 → 80kcal
      expect(result.current.totals.kcal).toBeCloseTo(130);
    });

    it('handles dish with no dish items found (empty dish)', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'dish', dishId: 'empty-dish', quantity: 100 });

      setupMocks({ scheduleFoods: [sf], dishItems: [] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals).toEqual({});
    });
  });

  // ─── Mixed food + dish ─────────────────────────────────────────────────────

  describe('mixed food and dish items', () => {
    it('handles mix of food and dish items', () => {
      const sfFood = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'apple', quantity: 100 });
      const sfDish = makeScheduleFood({ id: 'sf2', type: 'dish', dishId: 'salad', quantity: 200 });

      setupMocks({
        scheduleFoods: [sfFood, sfDish],
        dishItems: [{ id: 'di1', dishId: 'salad', productId: 'banana', quantity: 200 }],
        products: [
          { id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 52 }] },
          { id: 'banana', nutrients: [{ nutrientId: 'kcal', quantity: 89 }] },
        ],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // food: apple 100g → 52kcal
      // dish: banana 200g base → 178kcal, user 200g → scale 1.0
      expect(result.current.totals.kcal).toBeCloseTo(230);
    });

    it('handles same product used as both standalone food and in a dish', () => {
      const sfFood = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'apple', quantity: 100 });
      const sfDish = makeScheduleFood({ id: 'sf2', type: 'dish', dishId: 'salad', quantity: 200 });

      setupMocks({
        scheduleFoods: [sfFood, sfDish],
        dishItems: [{ id: 'di1', dishId: 'salad', productId: 'apple', quantity: 200 }],
        products: [{ id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 52 }] }],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // food: apple 100g → 52kcal
      // dish: apple 200g base → 104kcal, user 200g → scale 1.0
      expect(result.current.totals.kcal).toBeCloseTo(156);
    });
  });

  // ─── Missing nutrients ──────────────────────────────────────────────────────

  describe('missing nutrients', () => {
    it('reports missing when product has no nutrients in map', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'missing-id', quantity: 100 });

      setupMocks({ scheduleFoods: [sf], dishItems: [] });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals).toEqual({});
      expect(result.current.missingNutrientNames).toEqual(['missing-id']);
    });

    it('reports missing when food has empty nutrients', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'water', quantity: 250 });

      setupMocks({
        scheduleFoods: [sf],
        dishItems: [],
        products: [{ id: 'water', nutrients: [] }],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals).toEqual({});
      expect(result.current.missingNutrientNames).toEqual(['water']);
    });

    it('does not duplicate missing names for same product added twice', () => {
      const sf1 = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'water', quantity: 100 });
      const sf2 = makeScheduleFood({ id: 'sf2', type: 'food', productId: 'water', quantity: 200 });

      setupMocks({
        scheduleFoods: [sf1, sf2],
        dishItems: [],
        products: [{ id: 'water', nutrients: [] }],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.missingNutrientNames).toEqual(['water']);
      expect(result.current.missingNutrientNames).toHaveLength(1);
    });

    it('reports dish as missing when one of its products has no nutrients', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'dish', dishId: 'salad', quantity: 300 });

      setupMocks({
        scheduleFoods: [sf],
        dishItems: [
          { id: 'di1', dishId: 'salad', productId: 'apple', quantity: 100 },
          { id: 'di2', dishId: 'salad', productId: 'water', quantity: 200 },
        ],
        products: [
          { id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 52 }] },
          { id: 'water', nutrients: [] },
        ],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.missingNutrientNames).toContain('salad');
    });

    it('still calculates dish nutrients even when flagged as missing', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'dish', dishId: 'salad', quantity: 300 });

      setupMocks({
        scheduleFoods: [sf],
        dishItems: [
          { id: 'di1', dishId: 'salad', productId: 'apple', quantity: 100 },
          { id: 'di2', dishId: 'salad', productId: 'water', quantity: 200 },
        ],
        products: [
          { id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 52 }] },
          { id: 'water', nutrients: [] },
        ],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // apple 100g → 52kcal base, scale 300/300=1.0 → 52kcal
      expect(result.current.totals.kcal).toBeCloseTo(52);
      expect(result.current.missingNutrientNames).toContain('salad');
    });

    it('reports both missing foods and missing dish nutrients', () => {
      const sfFood = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'rye', quantity: 100 });
      const sfDish = makeScheduleFood({ id: 'sf2', type: 'dish', dishId: 'salad', quantity: 100 });

      setupMocks({
        scheduleFoods: [sfFood, sfDish],
        dishItems: [{ id: 'di1', dishId: 'salad', productId: 'water', quantity: 100 }],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.missingNutrientNames).toContain('rye');
      expect(result.current.missingNutrientNames).toContain('salad');
    });
  });

  // ─── Edge cases ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles zero quantity food item (contributes 0 to totals)', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'apple', quantity: 0 });

      setupMocks({
        scheduleFoods: [sf],
        dishItems: [],
        products: [{ id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 52 }] }],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      expect(result.current.totals.kcal).toBeCloseTo(0);
    });

    it('handles food with many different nutrients', () => {
      const sf = makeScheduleFood({ id: 'sf1', type: 'food', productId: 'complete', quantity: 100 });

      setupMocks({
        scheduleFoods: [sf],
        dishItems: [],
        products: [{
          id: 'complete',
          nutrients: [
            { nutrientId: 'kcal', quantity: 250 },
            { nutrientId: 'protein', quantity: 20 },
            { nutrientId: 'fat', quantity: 10 },
            { nutrientId: 'carbs', quantity: 30 },
            { nutrientId: 'fiber', quantity: 5 },
            { nutrientId: 'sodium', quantity: 0.5 },
            { nutrientId: 'calcium', quantity: 0.1 },
          ],
        }],
      });

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

    it('large schedule with many items calculates correctly', () => {
      const scheduleFoods = Array.from({ length: 10 }, (_, i) =>
        makeScheduleFood({ id: `sf${i}`, type: 'food', productId: 'apple', quantity: 100 }),
      );

      setupMocks({
        scheduleFoods,
        dishItems: [],
        products: [{ id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 52 }] }],
      });

      const { result } = renderHook(() => useScheduleNutrientTotals('2026-01-01'));
      // 10 × 52kcal = 520kcal
      expect(result.current.totals.kcal).toBeCloseTo(520);
    });
  });
});
