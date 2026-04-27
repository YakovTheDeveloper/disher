import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clear } from 'idb-keyval';

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
import {
  clearPending,
  getPendingCount,
  primePendingCache,
} from '@/shared/lib/storage/pendingWrites';
import { get } from 'idb-keyval';
import type { PendingWrite } from '@/shared/lib/storage/pendingWrites';
import {
  createProduct,
  updateProduct,
  setProductNutrients,
  setProductPortions,
  deleteProduct,
  deleteProducts,
} from './mutations';
import type { Product } from '../model/types';

const KEY = 'foodcalc-pending-writes';

async function readQueue(): Promise<PendingWrite[]> {
  return (await get<PendingWrite[]>(KEY)) ?? [];
}

function seedProductsCache(rows: Product[]) {
  queryClient.setQueryData(['products', 'all', 'user-1'], rows);
}

function readProductsCache(): Product[] | undefined {
  return queryClient.getQueryData<Product[]>(['products', 'all', 'user-1']);
}

const baseProduct: Product = {
  id: 'p-existing',
  userId: 'user-1',
  name: 'apple',
  nameEng: 'apple',
  description: '',
  descriptionEng: '',
  source: '',
  pricePerKg: 0,
  nutrients: '{}',
  portions: '[]',
  categories: '[]',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
};

describe('product mutations', () => {
  beforeEach(async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    await clear();
    await clearPending();
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('createProduct: optimistically adds to cache + enqueues insert', async () => {
    seedProductsCache([baseProduct]);

    const id = await createProduct({ name: 'banana' });

    const cache = readProductsCache()!;
    expect(cache).toHaveLength(2);
    expect(cache[1]?.id).toBe(id);
    expect(cache[1]?.name).toBe('banana');
    expect(cache[1]?.userId).toBe('user-1');

    const queue = await readQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.table).toBe('products');
    expect(queue[0]?.op).toBe('insert');
    expect(queue[0]?.payload).toMatchObject({
      id,
      user_id: 'user-1',
      name: 'banana',
      nutrients: {},
      portions: [],
      categories: [],
    });
  });

  it('updateProduct: optimistically patches cache + enqueues upsert with snake_case payload', async () => {
    seedProductsCache([baseProduct]);

    await updateProduct('p-existing', { name: 'green apple', pricePerKg: 100 });

    const cache = readProductsCache()!;
    expect(cache[0]?.name).toBe('green apple');
    expect(cache[0]?.pricePerKg).toBe(100);

    const queue = await readQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.payload).toMatchObject({
      id: 'p-existing',
      name: 'green apple',
      price_per_kg: 100,
    });
  });

  it('updateProduct: parses jsonb fields (nutrients/portions/categories) before enqueue', async () => {
    seedProductsCache([baseProduct]);

    await updateProduct('p-existing', {
      nutrients: '{"protein":10}',
      portions: '[{"l":"cup","g":200}]',
      categories: '["fruit"]',
    });

    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({
      nutrients: { protein: 10 },
      portions: [{ l: 'cup', g: 200 }],
      categories: ['fruit'],
    });
  });

  it('setProductNutrients / setProductPortions delegate to updateProduct', async () => {
    seedProductsCache([baseProduct]);

    await setProductNutrients('p-existing', '{"fat":5}');
    await setProductPortions('p-existing', '[{"l":"slice","g":50}]');

    const queue = await readQueue();
    expect(queue).toHaveLength(2);
    expect(queue[0]?.payload).toMatchObject({ nutrients: { fat: 5 } });
    expect(queue[1]?.payload).toMatchObject({ portions: [{ l: 'slice', g: 50 }] });
  });

  it('deleteProduct: removes from cache + enqueues delete', async () => {
    seedProductsCache([baseProduct]);

    await deleteProduct('p-existing');

    expect(readProductsCache()).toEqual([]);
    const queue = await readQueue();
    expect(queue[0]).toMatchObject({
      table: 'products',
      op: 'delete',
      payload: { id: 'p-existing' },
    });
  });

  it('deleteProducts: bulk removal + N enqueued deletes in order', async () => {
    seedProductsCache([
      { ...baseProduct, id: 'a' },
      { ...baseProduct, id: 'b' },
      { ...baseProduct, id: 'c' },
    ]);

    await deleteProducts(['a', 'c']);

    expect(readProductsCache()!.map((p) => p.id)).toEqual(['b']);
    const queue = await readQueue();
    expect(queue).toHaveLength(2);
    expect(queue.map((q) => q.payload)).toEqual([{ id: 'a' }, { id: 'c' }]);
  });

  it('deleteProducts: empty array is no-op (no enqueue, no cache change)', async () => {
    seedProductsCache([baseProduct]);

    await deleteProducts([]);

    expect(readProductsCache()).toEqual([baseProduct]);
    expect(getPendingCount()).toBe(0);
  });

  it('createProduct without user → throws "Not authenticated"', async () => {
    const auth = await import('@/shared/lib/auth/useUserId');
    vi.spyOn(auth, 'getUserIdSync').mockReturnValueOnce(null);

    await expect(createProduct({ name: 'x' })).rejects.toThrow('Not authenticated');
  });

  it('updateProduct with empty updates is a no-op', async () => {
    seedProductsCache([baseProduct]);
    await updateProduct('p-existing', {});
    expect(getPendingCount()).toBe(0);
  });

  it('queue persists across primePendingCache (durability check)', async () => {
    seedProductsCache([baseProduct]);
    await createProduct({ name: 'x' });
    expect(getPendingCount()).toBe(1);

    // Симулируем рестарт — вызываем primePendingCache, который тянет из IDB.
    await primePendingCache();
    expect(getPendingCount()).toBe(1);
  });
});
