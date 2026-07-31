import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NavigateFunction } from 'react-router-dom';

// Хойстед-спай на навигацию: фабрика vi.mock поднимается над импортами.
const { pushNavigate } = vi.hoisted(() => ({ pushNavigate: vi.fn() }));
vi.mock('@/shared/lib/viewTransition', () => ({ pushNavigate }));

import { buildInfoActions } from './buildInfoActions';

const navigate = vi.fn() as unknown as NavigateFunction;

describe('buildInfoActions — «Информация о…» guard (bug B1)', () => {
  beforeEach(() => {
    pushNavigate.mockClear();
  });

  it('food + productId → navigates to /product/:id', () => {
    const actions = buildInfoActions({ type: 'food', productId: 'p1', dishId: null }, navigate);

    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe('Информация о продукте');
    actions[0].onClick();
    expect(pushNavigate).toHaveBeenCalledWith(navigate, '/product/p1', 'push');
  });

  it('dish + dishId → navigates to /dish/:id', () => {
    const actions = buildInfoActions({ type: 'dish', productId: null, dishId: 'd1' }, navigate);

    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe('Информация о блюде');
    actions[0].onClick();
    expect(pushNavigate).toHaveBeenCalledWith(navigate, '/dish/d1', 'push');
  });

  it('food with null productId → NO info action (never navigates to /product/null)', () => {
    const actions = buildInfoActions({ type: 'food', productId: null, dishId: null }, navigate);

    expect(actions).toEqual([]);
    expect(pushNavigate).not.toHaveBeenCalled();
  });

  it('dish with null dishId → NO info action', () => {
    expect(buildInfoActions({ type: 'dish', productId: null, dishId: null }, navigate)).toEqual([]);
  });

  it('DishBuilder-style ingredient (type food + productId) → /product/:id', () => {
    const actions = buildInfoActions({ type: 'food', productId: 'ing-1', dishId: null }, navigate);
    actions[0].onClick();
    expect(pushNavigate).toHaveBeenCalledWith(navigate, '/product/ing-1', 'push');
  });

  it('catalog product (sk-*) → NO info action: у каталога нет страницы (гейта isCatalogId)', () => {
    // 'sk-1070' — реальный id из shared/data/catalog.json (build-route, read-only).
    const actions = buildInfoActions({ type: 'food', productId: 'sk-1070', dishId: null }, navigate);

    expect(actions).toEqual([]);
    expect(pushNavigate).not.toHaveBeenCalled();
  });
});
