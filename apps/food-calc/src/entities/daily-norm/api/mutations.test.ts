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
  createDailyNorm,
  updateDailyNorm,
  deleteDailyNorm,
  setDailyNormNutrient,
} from './mutations';
import type { DailyNorm } from '../model/types';

const KEY = 'foodcalc-pending-writes';

async function readQueue(): Promise<PendingWrite[]> {
  return (await get<PendingWrite[]>(KEY)) ?? [];
}

const baseNorm: DailyNorm = {
  id: 'n-1',
  userId: 'user-1',
  name: 'standard',
  description: '',
  items: '{"protein":50}',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
};

function seed(rows: DailyNorm[]) {
  queryClient.setQueryData(['daily_norms', 'all', 'user-1'], rows);
}
function readCache() {
  return queryClient.getQueryData<DailyNorm[]>(['daily_norms', 'all', 'user-1']);
}

describe('daily-norm mutations', () => {
  beforeEach(async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    await clear();
    await clearPending();
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('createDailyNorm: optimistic adds JSON-string items to cache; payload sends parsed object', async () => {
    seed([]);
    const id = await createDailyNorm('high-protein', 'descr', { protein: 100, fat: 70 });
    const cache = readCache()!;
    expect(cache[0]?.id).toBe(id);
    expect(typeof cache[0]?.items).toBe('string');
    expect(JSON.parse(cache[0]!.items)).toEqual({ protein: 100, fat: 70 });
    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({
      id,
      name: 'high-protein',
      description: 'descr',
      items: { protein: 100, fat: 70 },
    });
  });

  it('createDailyNorm: defaults items to {}', async () => {
    seed([]);
    await createDailyNorm('plain', '');
    const queue = await readQueue();
    expect((queue[0]?.payload as { items: unknown }).items).toEqual({});
  });

  it('updateDailyNorm: items string → enqueued as parsed object (jsonb)', async () => {
    seed([baseNorm]);
    await updateDailyNorm('n-1', { items: '{"carbs":200}' });
    const cache = readCache()!;
    expect(cache[0]?.items).toBe('{"carbs":200}');
    const queue = await readQueue();
    expect((queue[0]?.payload as { items: unknown }).items).toEqual({ carbs: 200 });
  });

  it('updateDailyNorm: invalid JSON in items → falls back to {}', async () => {
    seed([baseNorm]);
    await updateDailyNorm('n-1', { items: 'not-json' });
    const queue = await readQueue();
    expect((queue[0]?.payload as { items: unknown }).items).toEqual({});
  });

  it('updateDailyNorm: name/description update without touching items', async () => {
    seed([baseNorm]);
    await updateDailyNorm('n-1', { name: 'renamed' });
    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({ id: 'n-1', name: 'renamed' });
    expect((queue[0]?.payload as Record<string, unknown>).items).toBeUndefined();
  });

  it('deleteDailyNorm: optimistic remove + enqueue delete', async () => {
    seed([baseNorm]);
    await deleteDailyNorm('n-1');
    expect(readCache()).toEqual([]);
    const queue = await readQueue();
    expect(queue[0]).toMatchObject({ table: 'daily_norms', op: 'delete', payload: { id: 'n-1' } });
  });

  it('setDailyNormNutrient: setting a number adds/updates the nutrient', async () => {
    seed([baseNorm]);
    await setDailyNormNutrient('n-1', 'fat', 80, { protein: 50 });
    const queue = await readQueue();
    expect((queue[0]?.payload as { items: unknown }).items).toEqual({ protein: 50, fat: 80 });
  });

  it('setDailyNormNutrient: null/0 deletes the nutrient', async () => {
    seed([baseNorm]);
    await setDailyNormNutrient('n-1', 'protein', null, { protein: 50, fat: 80 });
    const queue = await readQueue();
    expect((queue[0]?.payload as { items: unknown }).items).toEqual({ fat: 80 });

    await setDailyNormNutrient('n-1', 'fat', 0, { fat: 80 });
    const queue2 = await readQueue();
    expect((queue2[1]?.payload as { items: unknown }).items).toEqual({});
  });
});
