import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUseDishItemsWithProducts = vi.fn();
const mockUseNutrientsByProductIds = vi.fn();

vi.mock('./queries', () => ({
  useDishItemsWithProducts: (...args: unknown[]) => mockUseDishItemsWithProducts(...args),
}));

vi.mock('@/entities/product', () => ({
  useNutrientsByProductIds: (...args: unknown[]) => mockUseNutrientsByProductIds(...args),
}));

import { useDishNutrientTotals } from './useDishNutrientTotals';

type Item = {
  id: string;
  productId: string;
  quantity: number;
  product?: { name: string | null } | null;
};

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
  items?: Item[];
  products?: Array<{ id: string; nutrients: Array<{ nutrientId: string; quantity: number }> }>;
}) {
  mockUseDishItemsWithProducts.mockReturnValue(opts.items ?? []);
  mockUseNutrientsByProductIds.mockReturnValue(buildNutrientsMap(opts.products ?? []));
}

beforeEach(() => {
  vi.clearAllMocks();
  setupMocks({});
});

describe('useDishNutrientTotals', () => {
  it('empty dish → empty totals + no missing', () => {
    const { result } = renderHook(() => useDishNutrientTotals('d1'));
    expect(result.current.totals).toEqual({});
    expect(result.current.missingNutrientNames).toEqual([]);
  });

  it('sums ingredient nutrients (per-100g, no user quantity → base weight)', () => {
    setupMocks({
      items: [
        { id: 'i1', productId: 'apple', quantity: 100, product: { name: 'яблоко' } },
        { id: 'i2', productId: 'banana', quantity: 200, product: { name: 'банан' } },
      ],
      products: [
        { id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 52 }] },
        { id: 'banana', nutrients: [{ nutrientId: 'kcal', quantity: 89 }] },
      ],
    });

    const { result } = renderHook(() => useDishNutrientTotals('d1'));
    // apple 100g → 52, banana 200g → 178 = 230
    expect(result.current.totals.kcal).toBeCloseTo(230);
    expect(result.current.missingNutrientNames).toEqual([]);
  });

  it('flags an ingredient with no nutrient data by product name', () => {
    setupMocks({
      items: [
        { id: 'i1', productId: 'apple', quantity: 100, product: { name: 'яблоко' } },
        { id: 'i2', productId: 'water', quantity: 200, product: { name: 'вода' } },
      ],
      products: [
        { id: 'apple', nutrients: [{ nutrientId: 'kcal', quantity: 52 }] },
        { id: 'water', nutrients: [] }, // empty → not in map
      ],
    });

    const { result } = renderHook(() => useDishNutrientTotals('d1'));
    expect(result.current.missingNutrientNames).toEqual(['вода']);
  });

  it('falls back to productId when the missing product has no resolved name', () => {
    setupMocks({
      items: [{ id: 'i1', productId: 'orphan-uuid', quantity: 100, product: null }],
      products: [],
    });

    const { result } = renderHook(() => useDishNutrientTotals('d1'));
    expect(result.current.missingNutrientNames).toEqual(['orphan-uuid']);
  });

  it('does not duplicate a missing name when the same product appears twice', () => {
    setupMocks({
      items: [
        { id: 'i1', productId: 'water', quantity: 100, product: { name: 'вода' } },
        { id: 'i2', productId: 'water', quantity: 50, product: { name: 'вода' } },
      ],
      products: [{ id: 'water', nutrients: [] }],
    });

    const { result } = renderHook(() => useDishNutrientTotals('d1'));
    expect(result.current.missingNutrientNames).toEqual(['вода']);
  });
});
