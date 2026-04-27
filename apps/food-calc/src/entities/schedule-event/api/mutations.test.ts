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
  addScheduleEvent,
  updateScheduleEvent,
  removeScheduleEvent,
  removeScheduleEvents,
} from './mutations';
import type { ScheduleEvent } from '../model/types';

const KEY = 'foodcalc-pending-writes';

async function readQueue(): Promise<PendingWrite[]> {
  return (await get<PendingWrite[]>(KEY)) ?? [];
}

const baseEvent: ScheduleEvent = {
  id: 'e-1',
  userId: 'user-1',
  date: '2026-04-27',
  time: '10:00',
  endTime: '',
  text: 'morning notes',
  atoms: [],
  createdAt: '2026-04-27T00:00:00.000Z',
  updatedAt: '2026-04-27T00:00:00.000Z',
  deletedAt: null,
};

function seed(rows: ScheduleEvent[]) {
  queryClient.setQueryData(['schedule_events', 'all', 'user-1'], rows);
}
function readCache() {
  return queryClient.getQueryData<ScheduleEvent[]>(['schedule_events', 'all', 'user-1']);
}

describe('schedule-event mutations', () => {
  beforeEach(async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    await clear();
    await clearPending();
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('addScheduleEvent: optimistic + enqueue with atoms as object (jsonb)', async () => {
    seed([]);
    const id = await addScheduleEvent({
      date: '2026-04-27',
      time: '11:00',
      text: 'lunch',
      atoms: [{ kind: 'tag', value: 'cafe' } as never],
    });

    const cache = readCache()!;
    expect(cache).toHaveLength(1);
    expect(cache[0]?.id).toBe(id);
    expect(cache[0]?.atoms).toHaveLength(1);

    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({
      id,
      date: '2026-04-27',
      time: '11:00',
      end_time: '',
      text: 'lunch',
    });
    // atoms должен быть объектом-массивом (jsonb), не строкой
    expect(Array.isArray((queue[0]?.payload as { atoms: unknown }).atoms)).toBe(true);
  });

  it('addScheduleEvent: defaults — atoms=[], endTime="", text=""', async () => {
    seed([]);
    await addScheduleEvent({ date: '2026-04-27', time: '12:00' });
    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({ end_time: '', text: '', atoms: [] });
  });

  it('updateScheduleEvent: optimistic patch + enqueue snake_case (end_time)', async () => {
    seed([baseEvent]);
    await updateScheduleEvent('e-1', {
      endTime: '11:00',
      text: 'updated',
      atoms: [{ kind: 'tag', value: 'gym' } as never],
    });

    const cache = readCache()!;
    expect(cache[0]?.endTime).toBe('11:00');
    expect(cache[0]?.text).toBe('updated');
    expect(cache[0]?.atoms).toHaveLength(1);

    const queue = await readQueue();
    expect(queue[0]?.payload).toMatchObject({
      id: 'e-1',
      end_time: '11:00',
      text: 'updated',
    });
    expect(Array.isArray((queue[0]?.payload as { atoms: unknown }).atoms)).toBe(true);
  });

  it('updateScheduleEvent: empty updates is no-op', async () => {
    seed([baseEvent]);
    await updateScheduleEvent('e-1', {});
    expect(getPendingCount()).toBe(0);
  });

  it('removeScheduleEvent: optimistic remove + enqueue delete', async () => {
    seed([baseEvent]);
    await removeScheduleEvent('e-1');
    expect(readCache()).toEqual([]);
    const queue = await readQueue();
    expect(queue[0]).toMatchObject({
      table: 'schedule_events',
      op: 'delete',
      payload: { id: 'e-1' },
    });
  });

  it('removeScheduleEvents: bulk + FIFO order in queue', async () => {
    seed([
      { ...baseEvent, id: 'a' },
      { ...baseEvent, id: 'b' },
    ]);
    await removeScheduleEvents(['a', 'b']);
    expect(readCache()).toEqual([]);
    const queue = await readQueue();
    expect(queue.map((q) => q.payload)).toEqual([{ id: 'a' }, { id: 'b' }]);
  });
});
