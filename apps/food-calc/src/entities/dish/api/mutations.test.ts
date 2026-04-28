import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clear, get } from 'idb-keyval';

vi.mock('@/shared/api/supabase-client', () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn(),
  },
}));

vi.mock('@/shared/lib/toaster', () => ({
  toaster: { error: vi.fn(), warning: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock('@/shared/lib/auth/useUserId', () => ({
  useUserId: () => 'user-1',
  getUserIdSync: () => 'user-1',
}));

import { QueryClient } from '@tanstack/react-query';

vi.mock('@/shared/lib/storage/queryClient', () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return { queryClient: qc };
});

import { queryClient } from '@/shared/lib/storage/queryClient';
import { clearPending } from '@/shared/lib/storage/pendingWrites';
import type { PendingWrite } from '@/shared/lib/storage/pendingWrites';
import {
  createDish,
  updateDishName,
  deleteDish,
  deleteDishes,
  addDishItem,
  updateDishItem,
  removeDishItem,
  copyDishItems,
  addDishPortion,
  updateDishPortion,
  removeDishPortion,
  dishItemsToScheduleFoods,
} from './mutations';
import type { Dish, DishItem, DishPortion } from '../model/types';

const KEY = 'foodcalc-pending-writes';

async function readQueue(): Promise<PendingWrite[]> {
  return (await get<PendingWrite[]>(KEY)) ?? [];
}

const baseDish: Dish = {
  id: 'd-1',
  userId: 'user-1',
  name: 'salad',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
};

const baseItem: DishItem = {
  id: 'i-1',
  userId: 'user-1',
  dishId: 'd-1',
  productId: 'p-1',
  quantity: 50,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
};

const basePortion: DishPortion = {
  id: 'po-1',
  userId: 'user-1',
  dishId: 'd-1',
  label: 'serving',
  amount: 1,
  unit: 'pc',
  grams: 250,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
};

function seedDishes(rows: Dish[]) {
  queryClient.setQueryData(['dishes', 'all', 'user-1'], rows);
}
function seedItems(rows: DishItem[]) {
  queryClient.setQueryData(['dish_items', 'all', 'user-1'], rows);
}
function seedPortions(rows: DishPortion[]) {
  queryClient.setQueryData(['dish_portions', 'all', 'user-1'], rows);
}

describe('dish mutations', () => {
  beforeEach(async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    await clear();
    await clearPending();
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('createDish: optimistic add + enqueue', async () => {
    seedDishes([]);
    const id = await createDish('soup');
    const cache = queryClient.getQueryData<Dish[]>(['dishes', 'all', 'user-1'])!;
    expect(cache[0]?.id).toBe(id);
    expect(cache[0]?.name).toBe('soup');
    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({ id, name: 'soup', user_id: 'user-1' });
  });

  it('updateDishName: optimistic rename + enqueue', async () => {
    seedDishes([baseDish]);
    await updateDishName('d-1', 'caesar');
    const cache = queryClient.getQueryData<Dish[]>(['dishes', 'all', 'user-1'])!;
    expect(cache[0]?.name).toBe('caesar');
    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({ id: 'd-1', name: 'caesar' });
  });

  it('deleteDish: removes dish + enqueues item deletes, portion deletes, then dish delete (FIFO)', async () => {
    seedDishes([baseDish]);
    seedItems([baseItem, { ...baseItem, id: 'i-2' }]);
    seedPortions([basePortion]);

    await deleteDish('d-1', ['i-1', 'i-2'], ['po-1']);

    expect(queryClient.getQueryData<Dish[]>(['dishes', 'all', 'user-1'])).toEqual([]);
    expect(queryClient.getQueryData<DishItem[]>(['dish_items', 'all', 'user-1'])).toEqual([]);
    expect(queryClient.getQueryData<DishPortion[]>(['dish_portions', 'all', 'user-1'])).toEqual([]);

    const queue = await readQueue();
    expect(queue.map((q) => `${q.table}:${(q.payload as { id: string }).id}`)).toEqual([
      'dish_items:i-1',
      'dish_items:i-2',
      'dish_portions:po-1',
      'dishes:d-1',
    ]);
  });

  it('deleteDishes: empty array is no-op', async () => {
    seedDishes([baseDish]);
    await deleteDishes([]);
    expect(queryClient.getQueryData<Dish[]>(['dishes', 'all', 'user-1'])).toEqual([baseDish]);
  });

  it('addDishItem: optimistic + enqueue with snake_case columns', async () => {
    seedItems([]);
    const id = await addDishItem({ dishId: 'd-1', productId: 'p-1', quantity: 75 });
    const cache = queryClient.getQueryData<DishItem[]>(['dish_items', 'all', 'user-1'])!;
    expect(cache[0]?.id).toBe(id);
    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({
      id,
      dish_id: 'd-1',
      product_id: 'p-1',
      quantity: 75,
    });
  });

  it('updateDishItem: optimistic + enqueue', async () => {
    seedItems([baseItem]);
    await updateDishItem('i-1', { quantity: 999 });
    const cache = queryClient.getQueryData<DishItem[]>(['dish_items', 'all', 'user-1'])!;
    expect(cache[0]?.quantity).toBe(999);
    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({ id: 'i-1', quantity: 999 });
  });

  it('removeDishItem: removes from cache + enqueues delete', async () => {
    seedItems([baseItem]);
    await removeDishItem('i-1');
    expect(queryClient.getQueryData<DishItem[]>(['dish_items', 'all', 'user-1'])).toEqual([]);
    const queue = await readQueue();
    expect(queue[0]).toMatchObject({ table: 'dish_items', op: 'delete', payload: { id: 'i-1' } });
  });

  it('copyDishItems: enqueues N inserts in order, all to target dishId', async () => {
    seedItems([]);
    await copyDishItems(
      [
        { productId: 'p-a', quantity: 10 },
        { productId: 'p-b', quantity: 20 },
      ],
      'd-target'
    );
    const cache = queryClient.getQueryData<DishItem[]>(['dish_items', 'all', 'user-1'])!;
    expect(cache).toHaveLength(2);
    expect(cache.every((r) => r.dishId === 'd-target')).toBe(true);
    const queue = await readQueue();
    expect(queue).toHaveLength(2);
    expect((queue[0]?.payload as { product_id: string }).product_id).toBe('p-a');
    expect((queue[1]?.payload as { product_id: string }).product_id).toBe('p-b');
  });

  it('addDishPortion: optimistic + enqueue', async () => {
    seedPortions([]);
    await addDishPortion('d-1', { label: 'large', amount: 1, unit: 'pc', grams: 500 });
    const cache = queryClient.getQueryData<DishPortion[]>(['dish_portions', 'all', 'user-1'])!;
    expect(cache).toHaveLength(1);
    expect(cache[0]?.grams).toBe(500);
    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({
      dish_id: 'd-1',
      label: 'large',
      grams: 500,
    });
  });

  it('updateDishPortion: optimistic + enqueue', async () => {
    seedPortions([basePortion]);
    await updateDishPortion('po-1', { grams: 300, label: 'small' });
    const cache = queryClient.getQueryData<DishPortion[]>(['dish_portions', 'all', 'user-1'])!;
    expect(cache[0]?.grams).toBe(300);
    expect(cache[0]?.label).toBe('small');
    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({ id: 'po-1', grams: 300, label: 'small' });
  });

  it('removeDishPortion: optimistic + enqueue delete', async () => {
    seedPortions([basePortion]);
    await removeDishPortion('po-1');
    expect(queryClient.getQueryData<DishPortion[]>(['dish_portions', 'all', 'user-1'])).toEqual([]);
  });

  it('createDish does NOT invalidateQueries (avoid insert-flicker race with drain)', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    queryClient.setQueryData(['dishes', 'all', 'user-1'], []);
    await createDish('soup');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('updateDishName does NOT invalidateQueries', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    queryClient.setQueryData(['dishes', 'all', 'user-1'], [baseDish]);
    await updateDishName('d-1', 'salad-2');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('addDishItem / updateDishItem / addDishPortion / updateDishPortion do NOT invalidateQueries', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    queryClient.setQueryData(['dish_items', 'all', 'user-1'], [baseItem]);
    queryClient.setQueryData(['dish_portions', 'all', 'user-1'], [basePortion]);

    await addDishItem({ dishId: 'd-1', productId: 'p-9', quantity: 100 });
    await updateDishItem('i-1', { quantity: 200 });
    await addDishPortion('d-1', { label: 'cup', amount: 1, unit: 'pc', grams: 250 });
    await updateDishPortion('po-1', { grams: 300 });

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('copyDishItems / dishItemsToScheduleFoods do NOT invalidateQueries (bulk-insert-flicker race)', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    queryClient.setQueryData(['dish_items', 'all', 'user-1'], []);
    queryClient.setQueryData(['schedule_foods', 'all', 'user-1'], []);

    await copyDishItems([{ productId: 'p-1', quantity: 50 }], 'd-2');
    await dishItemsToScheduleFoods(
      [{ productId: 'p-1', quantity: 100 }],
      '2026-05-10',
      '07:30'
    );

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('dishItemsToScheduleFoods: writes into schedule_foods table with given date+time', async () => {
    queryClient.setQueryData(['schedule_foods', 'all', 'user-1'], []);
    await dishItemsToScheduleFoods(
      [{ productId: 'p-1', quantity: 100 }],
      '2026-05-10',
      '07:30'
    );
    const queue = await readQueue();
    expect(queue[0]?.table).toBe('schedule_foods');
    expect(queue[0]?.payload).toMatchObject({
      date: '2026-05-10',
      time: '07:30',
      product_id: 'p-1',
      quantity: 100,
      type: 'food',
    });
  });
});
