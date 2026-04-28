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
import { clearPending, getPendingCount } from '@/shared/lib/storage/pendingWrites';
import type { PendingWrite } from '@/shared/lib/storage/pendingWrites';
import {
  addScheduleFood,
  updateScheduleFood,
  removeScheduleFood,
  removeScheduleFoods,
  pasteClipboardItems,
} from './mutations';
import type { ScheduleFood } from '../model/types';

const KEY = 'foodcalc-pending-writes';

async function readQueue(): Promise<PendingWrite[]> {
  return (await get<PendingWrite[]>(KEY)) ?? [];
}

function seedCache(rows: ScheduleFood[]) {
  queryClient.setQueryData(['schedule_foods', 'all', 'user-1'], rows);
}
function readCache() {
  return queryClient.getQueryData<ScheduleFood[]>(['schedule_foods', 'all', 'user-1']);
}

const baseRow: ScheduleFood = {
  id: 'sf-existing',
  userId: 'user-1',
  date: '2026-04-27',
  time: '12:00',
  type: 'food',
  quantity: 100,
  details: '',
  productId: 'p-1',
  dishId: null,
  createdAt: '2026-04-27T00:00:00.000Z',
  updatedAt: '2026-04-27T00:00:00.000Z',
  deletedAt: null,
};

describe('schedule-food mutations', () => {
  beforeEach(async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    await clear();
    await clearPending();
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('addScheduleFood (product): optimistic + enqueue insert', async () => {
    seedCache([]);

    const id = await addScheduleFood({
      date: '2026-04-27',
      time: '13:00',
      type: 'food',
      quantity: 200,
      productId: 'p-2',
    });

    const cache = readCache()!;
    expect(cache).toHaveLength(1);
    expect(cache[0]).toMatchObject({ id, productId: 'p-2', dishId: null, quantity: 200 });

    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({
      id,
      product_id: 'p-2',
      dish_id: null,
      type: 'food',
      quantity: 200,
    });
  });

  it('addScheduleFood (dish): same path with dishId', async () => {
    seedCache([]);
    const id = await addScheduleFood({
      date: '2026-04-27',
      time: '13:00',
      type: 'dish',
      quantity: 1,
      dishId: 'd-1',
    });
    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({ id, product_id: null, dish_id: 'd-1', type: 'dish' });
  });

  it('addScheduleFood: throws if both productId and dishId set', async () => {
    await expect(
      addScheduleFood({
        date: '2026-04-27',
        time: '12:00',
        type: 'food',
        quantity: 100,
        productId: 'p',
        dishId: 'd',
      })
    ).rejects.toThrow();
  });

  it('addScheduleFood: throws if neither productId nor dishId set', async () => {
    await expect(
      addScheduleFood({
        date: '2026-04-27',
        time: '12:00',
        type: 'food',
        quantity: 100,
      })
    ).rejects.toThrow();
  });

  it('updateScheduleFood: optimistic patch + enqueue upsert with snake_case', async () => {
    seedCache([baseRow]);

    await updateScheduleFood('sf-existing', { quantity: 250, time: '14:30' });

    const cache = readCache()!;
    expect(cache[0]?.quantity).toBe(250);
    expect(cache[0]?.time).toBe('14:30');

    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({
      id: 'sf-existing',
      quantity: 250,
      time: '14:30',
    });
  });

  it('updateScheduleFood: switching from product to dish (productId=null, dishId set)', async () => {
    seedCache([baseRow]);

    await updateScheduleFood('sf-existing', {
      productId: null,
      dishId: 'd-99',
      type: 'dish',
    });

    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({
      product_id: null,
      dish_id: 'd-99',
      type: 'dish',
    });
  });

  it('removeScheduleFood: optimistic remove + enqueue delete', async () => {
    seedCache([baseRow]);

    await removeScheduleFood('sf-existing');

    expect(readCache()).toEqual([]);
    const queue = await readQueue();
    expect(queue[0]).toMatchObject({
      table: 'schedule_foods',
      op: 'delete',
      payload: { id: 'sf-existing' },
    });
  });

  it('addScheduleFood does NOT invalidateQueries (avoid insert-flicker race with drain)', async () => {
    // Background: invalidateQueries right after enqueue used to trigger a refetch
    // BEFORE drain finished POSTing the row. The server returned the list without
    // the new row, blowing away the optimistic copy until next focus/reconnect.
    // Optimistic patch + drain-success carries the same id/payload, so the cache
    // already matches the server. No invalidate needed.
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    seedCache([]);

    await addScheduleFood({
      date: '2026-04-27',
      time: '13:00',
      type: 'food',
      quantity: 100,
      productId: 'p-2',
    });

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('updateScheduleFood does NOT invalidateQueries (avoid update-flicker race with drain)', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    seedCache([baseRow]);

    await updateScheduleFood('sf-existing', { quantity: 250 });

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('pasteClipboardItems does NOT invalidateQueries (avoid bulk-insert-flicker race)', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    seedCache([]);

    await pasteClipboardItems(
      [
        {
          time: '08:00',
          type: 'food',
          quantity: 100,
          productId: 'p1',
          dishId: null,
          details: '',
          displayName: 'A',
        },
      ],
      '2026-05-01'
    );

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('G3: removeScheduleFood does NOT invalidateQueries (avoid delete-flicker)', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    seedCache([baseRow]);

    await removeScheduleFood('sf-existing');

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('G3: removeScheduleFoods (bulk) does NOT invalidateQueries', async () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    seedCache([
      { ...baseRow, id: 'a' },
      { ...baseRow, id: 'b' },
    ]);

    await removeScheduleFoods(['a', 'b']);

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('removeScheduleFoods: bulk; preserves FIFO order in queue', async () => {
    seedCache([
      { ...baseRow, id: 'a' },
      { ...baseRow, id: 'b' },
      { ...baseRow, id: 'c' },
    ]);
    await removeScheduleFoods(['a', 'c']);
    expect(readCache()!.map((r) => r.id)).toEqual(['b']);
    const queue = await readQueue();
    expect(queue.map((q) => q.payload)).toEqual([{ id: 'a' }, { id: 'c' }]);
  });

  it('removeScheduleFoods: empty array is no-op', async () => {
    seedCache([baseRow]);
    await removeScheduleFoods([]);
    expect(readCache()).toEqual([baseRow]);
    expect(getPendingCount()).toBe(0);
  });

  it('pasteClipboardItems: enqueues N inserts in order with target date', async () => {
    seedCache([]);
    await pasteClipboardItems(
      [
        {
          time: '08:00',
          type: 'food',
          quantity: 100,
          productId: 'p1',
          dishId: null,
          details: '',
          displayName: 'A',
        },
        {
          time: '12:00',
          type: 'food',
          quantity: 200,
          productId: 'p2',
          dishId: null,
          details: '',
          displayName: 'B',
        },
      ],
      '2026-05-01'
    );

    const cache = readCache()!;
    expect(cache).toHaveLength(2);
    expect(cache.every((r) => r.date === '2026-05-01')).toBe(true);

    const queue = await readQueue();
    expect(queue).toHaveLength(2);
    expect((queue[0]?.payload as { time: string }).time).toBe('08:00');
    expect((queue[1]?.payload as { time: string }).time).toBe('12:00');
  });

  it('pasteClipboardItems: empty array is no-op', async () => {
    await pasteClipboardItems([], '2026-05-01');
    expect(getPendingCount()).toBe(0);
  });
});
