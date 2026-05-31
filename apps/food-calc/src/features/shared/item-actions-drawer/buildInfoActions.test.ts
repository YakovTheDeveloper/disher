import { describe, it, expect, vi } from 'vitest';

// Avoid loading the real router module (it imports every page + assets).
vi.mock('@/app/router', () => ({
  getProductUrl: (id: string) => `/product/${id}`,
  RouterUrls: { getDish: (id: string) => `/dish/${id}` },
}));

import { buildInfoActions } from './buildInfoActions';

describe('buildInfoActions — drawer «Информация о…» guard (bug B1)', () => {
  it('food + productId → navigates to the product page', () => {
    const navigate = vi.fn();
    const actions = buildInfoActions({ type: 'food', productId: 'p1', dishId: null }, navigate);

    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe('Информация о продукте');
    actions[0].onClick();
    expect(navigate).toHaveBeenCalledWith('/product/p1');
  });

  it('dish + dishId → navigates to the dish page', () => {
    const navigate = vi.fn();
    const actions = buildInfoActions({ type: 'dish', productId: null, dishId: 'd1' }, navigate);

    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe('Информация о блюде');
    actions[0].onClick();
    expect(navigate).toHaveBeenCalledWith('/dish/d1');
  });

  it('food with null productId → NO info action (never navigates to /product/null)', () => {
    const navigate = vi.fn();
    const actions = buildInfoActions({ type: 'food', productId: null, dishId: null }, navigate);

    expect(actions).toEqual([]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('dish with null dishId → NO info action', () => {
    const navigate = vi.fn();
    expect(buildInfoActions({ type: 'dish', productId: null, dishId: null }, navigate)).toEqual([]);
  });

  it('DishBuilder-style ingredient (type food + productId) → product page', () => {
    const navigate = vi.fn();
    const actions = buildInfoActions({ type: 'food', productId: 'ing-1', dishId: null }, navigate);
    actions[0].onClick();
    expect(navigate).toHaveBeenCalledWith('/product/ing-1');
  });
});
