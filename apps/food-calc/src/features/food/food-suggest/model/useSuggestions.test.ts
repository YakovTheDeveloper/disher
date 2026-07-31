import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_NORM_ITEMS } from '@/entities/daily-norm';
import type { Product } from '@/entities/product';
import type { Dish, DishItem, DishPortion } from '@/entities/dish';

const mockTotals = vi.fn();
const mockTotalsLoading = vi.fn();
const mockUserNormItems = vi.fn();
const mockHasUserNorm = vi.fn();
const mockProducts = vi.fn();
const mockProductsLoading = vi.fn();
const mockDishes = vi.fn();
const mockDishesLoading = vi.fn();
const mockDishItems = vi.fn();
const mockDishItemsLoading = vi.fn();
const mockDishPortions = vi.fn();
const mockDishPortionsLoading = vi.fn();
const mockBlacklist = vi.fn();
const mockBlacklistLoading = vi.fn();

vi.mock('@/entities/schedule-food', () => ({
  useScheduleNutrientTotals: () => ({ totals: mockTotals(), isLoading: mockTotalsLoading() }),
}));

vi.mock('@/entities/daily-norm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/daily-norm')>();
  return {
    ...actual,
    useUserNormItems: () => mockUserNormItems(),
    useHasUserNorm: () => mockHasUserNorm(),
  };
});

vi.mock('@/entities/product', () => ({
  useProducts: () => mockProducts(),
  useProductsLoading: () => mockProductsLoading(),
}));

vi.mock('@/entities/dish', () => ({
  useDishes: () => mockDishes(),
  useDishesLoading: () => mockDishesLoading(),
  useDishItemsByDishIds: () => mockDishItems(),
  useDishItemsLoading: () => mockDishItemsLoading(),
  useDishPortionsByDishIds: () => mockDishPortions(),
  useDishPortionsLoading: () => mockDishPortionsLoading(),
}));

vi.mock('@/entities/product-blacklist', () => ({
  useBlacklistedProductIds: () => mockBlacklist(),
  useBlacklistLoading: () => mockBlacklistLoading(),
}));

import { useSuggestions } from './useSuggestions';

function makeProduct(overrides: Partial<Product> & { id: string; name: string }): Product {
  return {
    source: 'user',
    nutrients: '{}',
    portions: '[]',
    categories: '[]',
    servingBasis: '100g',
    servingUnit: null,
    description: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeDish(overrides: Partial<Dish> & { id: string; name: string }): Dish {
  return { description: '', createdAt: '2026-01-01T00:00:00.000Z', ...overrides };
}

function makeDishItem(overrides: Partial<DishItem> & Pick<DishItem, 'id' | 'dishId' | 'productId'>): DishItem {
  return { quantity: 100, details: '', createdAt: '2026-01-01T00:00:00.000Z', ...overrides };
}

function makeDishPortion(
  overrides: Partial<DishPortion> & Pick<DishPortion, 'id' | 'dishId' | 'grams'>,
): DishPortion {
  return { label: 'порция', createdAt: '2026-01-01T00:00:00.000Z', ...overrides };
}

// Норма только по белку (id '1') и энергии (id '7') — дефицит белка 50 г.
const NORMS = { '1': 70, '7': 2000 };

describe('useSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTotals.mockReturnValue({ '1': 20, '7': 1000 });
    mockTotalsLoading.mockReturnValue(false);
    mockUserNormItems.mockReturnValue(NORMS);
    mockHasUserNorm.mockReturnValue(true);
    mockProducts.mockReturnValue([]);
    mockProductsLoading.mockReturnValue(false);
    mockDishes.mockReturnValue([]);
    mockDishesLoading.mockReturnValue(false);
    mockDishItems.mockReturnValue([]);
    mockDishItemsLoading.mockReturnValue(false);
    mockDishPortions.mockReturnValue([]);
    mockDishPortionsLoading.mockReturnValue(false);
    mockBlacklist.mockReturnValue(new Set());
    mockBlacklistLoading.mockReturnValue(false);
  });

  it('ранжирует белковый продукт выше специи при дефиците белка', () => {
    mockProducts.mockReturnValue([
      makeProduct({
        id: 'chicken',
        name: 'Куриная грудка',
        // 23 г белка на 100 г; порция по умолчанию 100 г.
        nutrients: JSON.stringify({ '1': 23, '7': 110 }),
      }),
      makeProduct({
        id: 'paprika',
        name: 'Паприка',
        categories: JSON.stringify(['spice']),
        // Плотность на 100 г высокая, но категорийный кап порции 5 г.
        nutrients: JSON.stringify({ '1': 14, '7': 280 }),
      }),
    ]);

    const { result } = renderHook(() => useSuggestions('2026-01-01'));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.suggestions.map((s) => s.ref.id)).toEqual(['chicken', 'paprika']);
    expect(result.current.topDeficits[0]?.id).toBe('1');
  });

  it('протягивает servingUnit продукта в suggestion (без per-row lookup в ряду)', () => {
    mockProducts.mockReturnValue([
      makeProduct({
        id: 'omega3',
        name: 'Омега-3',
        servingBasis: 'serving',
        servingUnit: 'шт',
        // serving-базис: нутриенты за дозу; дефицит белка 50 г, доза 60 г.
        nutrients: JSON.stringify({ '1': 60 }),
      }),
    ]);

    const { result } = renderHook(() => useSuggestions('2026-01-01'));
    const s = result.current.suggestions[0];
    expect(s.portionGrams).toBe(1);
    expect(s.portionUnit).toBe('шт');
  });

  it('исключает продукты из blacklist', () => {
    mockProducts.mockReturnValue([
      makeProduct({ id: 'chicken', name: 'Куриная грудка', nutrients: JSON.stringify({ '1': 23 }) }),
      makeProduct({ id: 'eggs', name: 'Яйца', nutrients: JSON.stringify({ '1': 13 }) }),
    ]);
    mockBlacklist.mockReturnValue(new Set(['chicken']));

    const { result } = renderHook(() => useSuggestions('2026-01-01'));
    expect(result.current.suggestions.map((s) => s.ref.id)).toEqual(['eggs']);
    expect(result.current.blacklistSize).toBe(1);
  });

  it('учитывает блюда как кандидатов (через dish_items)', () => {
    mockProducts.mockReturnValue([
      makeProduct({ id: 'chicken', name: 'Куриная грудка', nutrients: JSON.stringify({ '1': 23 }) }),
    ]);
    mockDishes.mockReturnValue([makeDish({ id: 'salad', name: 'Салат с курицей' })]);
    mockDishItems.mockReturnValue([makeDishItem({ id: 'di1', dishId: 'salad', productId: 'chicken' })]);

    const { result } = renderHook(() => useSuggestions('2026-01-01'));
    const ids = result.current.suggestions.map((s) => s.ref.id);
    expect(ids).toContain('salad');
  });

  it('именованная порция блюда (dish_portions 350 г) — порция кандидата 350 г', () => {
    mockProducts.mockReturnValue([
      makeProduct({ id: 'chicken', name: 'Куриная грудка', nutrients: JSON.stringify({ '1': 23 }) }),
    ]);
    mockDishes.mockReturnValue([makeDish({ id: 'salad', name: 'Салат с курицей' })]);
    mockDishItems.mockReturnValue([makeDishItem({ id: 'di1', dishId: 'salad', productId: 'chicken' })]);
    mockDishPortions.mockReturnValue([makeDishPortion({ id: 'dp1', dishId: 'salad', grams: 350 })]);

    const { result } = renderHook(() => useSuggestions('2026-01-01'));
    const salad = result.current.suggestions.find((s) => s.ref.id === 'salad');
    expect(salad?.portionGrams).toBe(350);
  });

  it('норма не задана (null) → дефициты считаются по DEFAULT_NORM_ITEMS', () => {
    mockUserNormItems.mockReturnValue(null);
    mockHasUserNorm.mockReturnValue(false);
    mockProducts.mockReturnValue([
      makeProduct({ id: 'chicken', name: 'Куриная грудка', nutrients: JSON.stringify({ '1': 23 }) }),
    ]);

    const { result } = renderHook(() => useSuggestions('2026-01-01'));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasUserNorm).toBe(false);
    // Дефолтная норма белка 70 г, съедено 20 → дефицит есть, список непустой.
    expect(DEFAULT_NORM_ITEMS['1']).toBe(70);
    expect(result.current.suggestions.length).toBeGreaterThan(0);
  });

  it('пустой объект норм {} (dev-reset) → как «нормы нет», дефолты', () => {
    mockUserNormItems.mockReturnValue({});
    mockHasUserNorm.mockReturnValue(false);
    mockProducts.mockReturnValue([
      makeProduct({ id: 'chicken', name: 'Куриная грудка', nutrients: JSON.stringify({ '1': 23 }) }),
    ]);

    const { result } = renderHook(() => useSuggestions('2026-01-01'));
    expect(result.current.isLoading).toBe(false);
    // {} не должен дать «дефицитов нет»: дефициты посчитаны по DEFAULT_NORM_ITEMS.
    expect(result.current.normComplete).toBe(false);
    expect(result.current.suggestions.length).toBeGreaterThan(0);
    expect(result.current.topDeficits.length).toBeGreaterThan(0);
  });

  it('норма ещё грузится (undefined) → isLoading, без расчёта на дефолтах', () => {
    mockUserNormItems.mockReturnValue(undefined);

    const { result } = renderHook(() => useSuggestions('2026-01-01'));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.suggestions).toEqual([]);
  });

  it.each([
    ['тоталы расписания', () => mockTotalsLoading.mockReturnValue(true)],
    ['продукты', () => mockProductsLoading.mockReturnValue(true)],
    ['блюда', () => mockDishesLoading.mockReturnValue(true)],
    ['dish_items', () => mockDishItemsLoading.mockReturnValue(true)],
    ['dish_portions', () => mockDishPortionsLoading.mockReturnValue(true)],
    ['blacklist', () => mockBlacklistLoading.mockReturnValue(true)],
  ])('гейт первого тика: грузится %s → isLoading, список пуст', (_label, arrange) => {
    arrange();
    mockProducts.mockReturnValue([
      makeProduct({ id: 'chicken', name: 'Куриная грудка', nutrients: JSON.stringify({ '1': 23 }) }),
    ]);

    const { result } = renderHook(() => useSuggestions('2026-01-01'));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.suggestions).toEqual([]);
  });

  it('дефицитов нет → normComplete и пустой список', () => {
    mockTotals.mockReturnValue({ '1': 100, '7': 3000 });
    mockProducts.mockReturnValue([
      makeProduct({ id: 'chicken', name: 'Куриная грудка', nutrients: JSON.stringify({ '1': 23 }) }),
    ]);

    const { result } = renderHook(() => useSuggestions('2026-01-01'));
    expect(result.current.normComplete).toBe(true);
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.topDeficits).toEqual([]);
  });
});
