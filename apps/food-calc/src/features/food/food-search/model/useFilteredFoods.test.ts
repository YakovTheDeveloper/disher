/* eslint-disable @typescript-eslint/no-explicit-any -- minimal product stubs */
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFilteredFoods } from './useFilteredFoods';

// Минимальные продукты: одна еда (basis '100g') + один БАД (basis 'serving').
const FOOD = { id: 'p1', name: 'Гречка', servingBasis: '100g' } as any;
const SUPP = { id: 'v1', name: 'Витамин D', servingBasis: 'serving' } as any;

vi.mock('@/entities/product', () => ({
  useProducts: () => [FOOD, SUPP],
  useNutrientsByProductIds: () => new Map(),
}));
vi.mock('@/entities/dish', () => ({
  useDishes: () => [],
}));
vi.mock('@/shared/data/catalog', () => ({
  // оба продукта трактуем как пользовательские (не catalog), чтобы
  // userOnlyProducts-фильтр не вмешивался в проверку excludeSupplements.
  isCatalogId: () => false,
}));

describe('useFilteredFoods — excludeSupplements', () => {
  it('keeps supplements when excludeSupplements is off (default)', () => {
    const { result } = renderHook(() => useFilteredFoods('', null, false, false));
    const ids = result.current.products.map((p) => p.id);
    expect(ids).toContain('p1');
    expect(ids).toContain('v1');
  });

  it('drops serving-basis products when excludeSupplements=true (контекст блюда)', () => {
    const { result } = renderHook(() => useFilteredFoods('', null, false, true));
    const ids = result.current.products.map((p) => p.id);
    expect(ids).toContain('p1');
    expect(ids).not.toContain('v1');
  });

  it('exclude works BEFORE Fuse — поиск по имени БАД не находит его', () => {
    // productsBase фильтруется до индексации Fuse → БАД нет в индексе вовсе,
    // поэтому даже прямой поиск его названия возвращает пусто (а не пост-фильтр).
    const { result } = renderHook(() => useFilteredFoods('Витамин', null, false, true));
    expect(result.current.products.map((p) => p.id)).not.toContain('v1');
  });
});
