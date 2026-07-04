import { describe, it, expect, vi, beforeEach } from 'vitest';

// Хойстед-спаи: фабрики vi.mock поднимаются над импортами, ссылаться можно
// только на vi.hoisted-значения.
const { show, ProductDrawerStub, DishDrawerStub } = vi.hoisted(() => ({
  show: vi.fn(),
  ProductDrawerStub: { __stub: 'ProductDrawer' },
  DishDrawerStub: { __stub: 'DishDrawer' },
}));

// И продукт, и блюдо теперь открывают боковой дровер (страницы инактивированы /
// заменены оверлеем). Заглушаем тяжёлые компоненты и стор — проверяем сам факт
// открытия нужного дровера.
vi.mock('@/shared/ui/drawer-store', () => ({ drawerStore: { show } }));
vi.mock('@/features/food/product-drawer/ProductDrawer', () => ({
  ProductDrawer: ProductDrawerStub,
}));
vi.mock('@/features/food/dish-drawer/DishDrawer', () => ({
  DishDrawer: DishDrawerStub,
}));

import { buildInfoActions } from './buildInfoActions';

describe('buildInfoActions — drawer «Информация о…» guard (bug B1)', () => {
  beforeEach(() => {
    show.mockClear();
  });

  it('food + productId → opens ProductDrawer', () => {
    const actions = buildInfoActions({ type: 'food', productId: 'p1', dishId: null });

    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe('Информация о продукте');
    actions[0].onClick();
    expect(show).toHaveBeenCalledWith(
      ProductDrawerStub,
      { productId: 'p1' },
      expect.objectContaining({ side: 'left' }),
    );
  });

  it('dish + dishId → opens DishDrawer (no page navigation)', () => {
    const actions = buildInfoActions({ type: 'dish', productId: null, dishId: 'd1' });

    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe('Информация о блюде');
    actions[0].onClick();
    expect(show).toHaveBeenCalledWith(
      DishDrawerStub,
      { dishId: 'd1' },
      expect.objectContaining({ side: 'left' }),
    );
  });

  it('food with null productId → NO info action (never opens a drawer for /product/null)', () => {
    const actions = buildInfoActions({ type: 'food', productId: null, dishId: null });

    expect(actions).toEqual([]);
    expect(show).not.toHaveBeenCalled();
  });

  it('dish with null dishId → NO info action', () => {
    expect(buildInfoActions({ type: 'dish', productId: null, dishId: null })).toEqual([]);
  });

  it('DishBuilder-style ingredient (type food + productId) → ProductDrawer', () => {
    const actions = buildInfoActions({ type: 'food', productId: 'ing-1', dishId: null });
    actions[0].onClick();
    expect(show).toHaveBeenCalledWith(
      ProductDrawerStub,
      { productId: 'ing-1' },
      expect.objectContaining({ side: 'left' }),
    );
  });
});
