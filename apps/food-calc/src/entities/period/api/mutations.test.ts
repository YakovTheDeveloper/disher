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
import { addPeriod, removePeriod, updatePeriod } from './mutations';
import type { Period } from './queries';

const KEY = 'foodcalc-pending-writes';

async function readQueue(): Promise<PendingWrite[]> {
  return (await get<PendingWrite[]>(KEY)) ?? [];
}

const basePeriod: Period = {
  id: 'pe-1',
  userId: 'user-1',
  name: 'morning',
  colorIndex: 3,
  fontFamily: 'sans',
  fontSize: 16,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
};

function seed(rows: Period[]) {
  queryClient.setQueryData(['periods', 'all', 'user-1'], rows);
}
function readCache() {
  return queryClient.getQueryData<Period[]>(['periods', 'all', 'user-1']);
}

describe('period mutations', () => {
  beforeEach(async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    await clear();
    await clearPending();
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('addPeriod: optimistic + enqueue with snake_case (color_index, font_family, font_size)', async () => {
    seed([]);
    const id = await addPeriod({ name: 'evening', colorIndex: 7 });
    const cache = readCache()!;
    expect(cache[0]?.id).toBe(id);
    expect(cache[0]?.name).toBe('evening');
    expect(cache[0]?.colorIndex).toBe(7);
    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({
      id,
      user_id: 'user-1',
      name: 'evening',
      color_index: 7,
      font_family: 'sans',
      font_size: 16,
    });
  });

  it('addPeriod: trims whitespace from name', async () => {
    seed([]);
    await addPeriod({ name: '  morning  ', colorIndex: 1 });
    const queue = await readQueue();
    expect((queue[0]?.payload as { name: string }).name).toBe('morning');
  });

  it('addPeriod: respects custom fontFamily and fontSize', async () => {
    seed([]);
    await addPeriod({ name: 'big', colorIndex: 1, fontFamily: 'serif', fontSize: 24 });
    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({ font_family: 'serif', font_size: 24 });
  });

  it('removePeriod: optimistic remove + enqueue delete', async () => {
    seed([basePeriod]);
    await removePeriod('pe-1');
    expect(readCache()).toEqual([]);
    const queue = await readQueue();
    expect(queue[0]).toMatchObject({ table: 'periods', op: 'delete', payload: { id: 'pe-1' } });
  });

  it('updatePeriod: optimistic patch + enqueue snake_case', async () => {
    seed([basePeriod]);
    await updatePeriod('pe-1', { colorIndex: 9, fontSize: 20 });
    const cache = readCache()!;
    expect(cache[0]?.colorIndex).toBe(9);
    expect(cache[0]?.fontSize).toBe(20);
    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({ id: 'pe-1', color_index: 9, font_size: 20 });
  });

  it('updatePeriod: empty updates is no-op', async () => {
    seed([basePeriod]);
    await updatePeriod('pe-1', {});
    expect(getPendingCount()).toBe(0);
  });
});
