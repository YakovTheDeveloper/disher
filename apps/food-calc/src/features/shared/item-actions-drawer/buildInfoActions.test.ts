import { describe, it, expect, vi, beforeEach } from 'vitest';

// Хойстед-спаи: фабрики vi.mock поднимаются над импортами, ссылаться можно
// только на vi.hoisted-значения.
const { show, pushNavigate, ProductDrawerStub } = vi.hoisted(() => ({
  show: vi.fn(),
  pushNavigate: vi.fn(),
  ProductDrawerStub: { __stub: 'ProductDrawer' },
}));

// Не грузим реальный router (тянет все страницы + ассеты).
vi.mock('@/app/router', () => ({
  RouterUrls: { getDish: (id: string) => `/dish/${id}` },
}));
// Продукт теперь открывает боковой ProductDrawer (страница инактивирована).
// Заглушаем тяжёлый компонент и стор — проверяем сам факт открытия.
vi.mock('@/shared/ui/drawer-store', () => ({ drawerStore: { show } }));
vi.mock('@/features/food/product-drawer/ProductDrawer', () => ({
  ProductDrawer: ProductDrawerStub,
}));
vi.mock('@/shared/lib/viewTransition', () => ({ pushNavigate }));

import { buildInfoActions } from './buildInfoActions';

describe('buildInfoActions — drawer «Информация о…» guard (bug B1)', () => {
  beforeEach(() => {
    show.mockClear();
    pushNavigate.mockClear();
  });

  it('food + productId → opens ProductDrawer (no page navigation)', () => {
    const navigate = vi.fn();
    const actions = buildInfoActions({ type: 'food', productId: 'p1', dishId: null }, navigate);

    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe('Информация о продукте');
    actions[0].onClick();
    expect(show).toHaveBeenCalledWith(
      ProductDrawerStub,
      { productId: 'p1' },
      expect.objectContaining({ side: 'left' }),
    );
    expect(pushNavigate).not.toHaveBeenCalled();
  });

  it('dish + dishId → navigates to the dish page', () => {
    const navigate = vi.fn();
    const actions = buildInfoActions({ type: 'dish', productId: null, dishId: 'd1' }, navigate);

    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe('Информация о блюде');
    actions[0].onClick();
    expect(pushNavigate).toHaveBeenCalledWith(navigate, '/dish/d1', 'push');
  });

  it('food with null productId → NO info action (never opens a drawer for /product/null)', () => {
    const navigate = vi.fn();
    const actions = buildInfoActions({ type: 'food', productId: null, dishId: null }, navigate);

    expect(actions).toEqual([]);
    expect(show).not.toHaveBeenCalled();
  });

  it('dish with null dishId → NO info action', () => {
    const navigate = vi.fn();
    expect(buildInfoActions({ type: 'dish', productId: null, dishId: null }, navigate)).toEqual([]);
  });

  it('DishBuilder-style ingredient (type food + productId) → ProductDrawer', () => {
    const navigate = vi.fn();
    const actions = buildInfoActions({ type: 'food', productId: 'ing-1', dishId: null }, navigate);
    actions[0].onClick();
    expect(show).toHaveBeenCalledWith(
      ProductDrawerStub,
      { productId: 'ing-1' },
      expect.objectContaining({ side: 'left' }),
    );
  });
});
