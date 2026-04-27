import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clear, get } from 'idb-keyval';

vi.mock('@/shared/api/supabase-client', () => {
  return {
    supabase: {
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
      from: vi.fn(),
    },
  };
});

vi.mock('@/shared/lib/toaster', () => ({
  toaster: { error: vi.fn(), warning: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

import { supabase } from '@/shared/api/supabase-client';
import {
  enqueue,
  drain,
  getPendingCount,
  primePendingCache,
  clearPending,
  subscribePending,
  type PendingWrite,
} from './pendingWrites';

const KEY = 'foodcalc-pending-writes';

function mockUpsert(error: { status: number } | null) {
  const upsert = vi.fn().mockResolvedValue({ error });
  (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ upsert });
  return upsert;
}

function mockUpsertSequence(errors: Array<{ status: number } | null>) {
  const upsert = vi.fn();
  for (const e of errors) upsert.mockResolvedValueOnce({ error: e });
  (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ upsert });
  return upsert;
}

function mockUpsertThrow(err: unknown) {
  const upsert = vi.fn().mockRejectedValue(err);
  (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ upsert });
  return upsert;
}

function mockDeleteUpdate(error: { status: number } | null) {
  const eq = vi.fn().mockResolvedValue({ error });
  const update = vi.fn().mockReturnValue({ eq });
  (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ update });
  return { update, eq };
}

describe('pendingWrites', () => {
  beforeEach(async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await clear();
    await clearPending();
    vi.clearAllMocks();
  });

  it('enqueue → drain happy path: sends to supabase then removes', async () => {
    const upsert = mockUpsert(null);

    await enqueue({ table: 'products', op: 'insert', payload: { id: 'p1', name: 'foo' } });
    expect(getPendingCount()).toBe(1);

    await drain();

    expect(upsert).toHaveBeenCalledWith({ id: 'p1', name: 'foo' }, { onConflict: 'id' });
    expect(getPendingCount()).toBe(0);
  });

  it('drain retry on 5xx keeps record; backoff blocks immediate retry', async () => {
    mockUpsert({ status: 503 });
    await enqueue({ table: 'products', op: 'insert', payload: { id: 'p2', name: 'bar' } });

    await drain();

    expect(getPendingCount()).toBe(1);
    const firstCallCount = (supabase.from as unknown as ReturnType<typeof vi.fn>).mock.calls
      .length;
    await drain();
    const secondCallCount = (supabase.from as unknown as ReturnType<typeof vi.fn>).mock.calls
      .length;
    expect(secondCallCount).toBe(firstCallCount); // backoff блокирует повторную попытку
  });

  it('drain poison on 4xx: drops record, fires toaster.error', async () => {
    const { toaster } = await import('@/shared/lib/toaster');
    mockUpsert({ status: 400 });
    await enqueue({ table: 'products', op: 'insert', payload: { id: 'p3', name: 'baz' } });

    await drain();

    expect(getPendingCount()).toBe(0);
    expect(toaster.error).toHaveBeenCalled();
  });

  it('primePendingCache drops records with old appVersion', async () => {
    const { set } = await import('idb-keyval');
    await set(KEY, [
      {
        qid: 'old-1',
        appVersion: 'OLD-VERSION',
        table: 'x',
        op: 'insert',
        payload: { id: '1' },
        attempts: 0,
        nextAttemptAt: 0,
      },
    ]);
    await primePendingCache();
    expect(getPendingCount()).toBe(0);
  });

  it('FIFO: dispatches enqueued records in insertion order', async () => {
    const dispatched: string[] = [];
    const upsert = vi.fn(async (payload: { id: string }) => {
      dispatched.push(payload.id);
      return { error: null };
    });
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ upsert });

    for (const id of ['a', 'b', 'c', 'd', 'e']) {
      await enqueue({ table: 'products', op: 'insert', payload: { id, name: id } });
    }

    await drain();

    expect(dispatched).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(getPendingCount()).toBe(0);
  });

  it('single-flight: parallel drain() calls do not duplicate dispatches', async () => {
    let pending: ((v: { error: null }) => void) | null = null;
    const dispatchPromise = new Promise<{ error: null }>((resolve) => {
      pending = resolve;
    });
    const upsert = vi.fn(() => dispatchPromise);
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ upsert });

    await enqueue({ table: 'products', op: 'insert', payload: { id: 'sf1' } });

    const d1 = drain();
    const d2 = drain();
    const d3 = drain();

    // Все три должны прийти к одной in-flight операции.
    pending!({ error: null });
    await Promise.all([d1, d2, d3]);

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(getPendingCount()).toBe(0);
  });

  it('401 → retry (not poison): record stays', async () => {
    mockUpsert({ status: 401 });
    await enqueue({ table: 'products', op: 'insert', payload: { id: 'auth1' } });

    await drain();

    expect(getPendingCount()).toBe(1);
  });

  it('408 / 425 / 429 → retry: record stays', async () => {
    for (const status of [408, 425, 429]) {
      await clearPending();
      await clear();
      mockUpsert({ status });
      await enqueue({ table: 'products', op: 'insert', payload: { id: `t${status}` } });

      await drain();

      expect(getPendingCount(), `status ${status} should retry`).toBe(1);
    }
  });

  it('5xx → retry: record stays', async () => {
    for (const status of [500, 502, 503, 504]) {
      await clearPending();
      await clear();
      mockUpsert({ status });
      await enqueue({ table: 'products', op: 'insert', payload: { id: `s${status}` } });

      await drain();

      expect(getPendingCount(), `status ${status} should retry`).toBe(1);
    }
  });

  it('4xx (other than 401/408/425/429) → poison: drops + toaster.error', async () => {
    const { toaster } = await import('@/shared/lib/toaster');
    for (const status of [400, 403, 404, 409, 422]) {
      await clearPending();
      await clear();
      vi.mocked(toaster.error).mockClear();
      mockUpsert({ status });
      await enqueue({ table: 'products', op: 'insert', payload: { id: `p${status}` } });

      await drain();

      expect(getPendingCount(), `status ${status} should poison`).toBe(0);
      expect(toaster.error, `status ${status} toaster`).toHaveBeenCalled();
    }
  });

  it('AbortError thrown by supabase fetch → retry', async () => {
    const abortErr = new DOMException('aborted', 'AbortError');
    mockUpsertThrow(abortErr);
    await enqueue({ table: 'products', op: 'insert', payload: { id: 'ab1' } });

    await drain();

    expect(getPendingCount()).toBe(1);
  });

  it('TypeError (network failed) thrown → retry', async () => {
    mockUpsertThrow(new TypeError('fetch failed'));
    await enqueue({ table: 'products', op: 'insert', payload: { id: 'ne1' } });

    await drain();

    expect(getPendingCount()).toBe(1);
  });

  it('MAX_ATTEMPTS exhaust → poison + tail keeps draining', async () => {
    const { toaster } = await import('@/shared/lib/toaster');
    // Первая запись: 9 раз 503, 10-я попытка тоже 503 → exhaust → poison.
    // Вторая запись: success на первой попытке.
    // Симулируем "attempts уже = 9" через прямой set в IDB, чтобы не ждать backoff.
    const { set } = await import('idb-keyval');
    const APP_VERSION = (await import('./persister')).APP_VERSION;
    const head: PendingWrite = {
      qid: 'exhausted',
      appVersion: APP_VERSION,
      table: 'products',
      op: 'insert',
      payload: { id: 'e1' },
      attempts: 9,
      nextAttemptAt: 0,
    };
    const tail: PendingWrite = {
      qid: 'fresh',
      appVersion: APP_VERSION,
      table: 'products',
      op: 'insert',
      payload: { id: 'e2' },
      attempts: 0,
      nextAttemptAt: 0,
    };
    await set(KEY, [head, tail]);
    await primePendingCache();
    expect(getPendingCount()).toBe(2);

    // Первая попытка (для head) — 503 → exhaust → poison + продолжаем.
    // Вторая попытка (для tail) — null → success.
    mockUpsertSequence([{ status: 503 }, null]);

    await drain();

    expect(getPendingCount()).toBe(0);
    expect(toaster.error).toHaveBeenCalled();
  });

  it('subscribePending: listener fires on enqueue / drain success / clearPending', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribePending(listener);

    mockUpsert(null);
    await enqueue({ table: 'products', op: 'insert', payload: { id: 'sub1' } });
    expect(listener).toHaveBeenCalled();
    const afterEnqueue = listener.mock.calls.length;

    await drain();
    expect(listener.mock.calls.length).toBeGreaterThan(afterEnqueue);
    const afterDrain = listener.mock.calls.length;

    await clearPending();
    expect(listener.mock.calls.length).toBeGreaterThan(afterDrain);

    unsubscribe();
    listener.mockClear();
    await enqueue({ table: 'products', op: 'insert', payload: { id: 'sub2' } });
    expect(listener).not.toHaveBeenCalled();
  });

  it('delete op: dispatches as update set deleted_at where id = X', async () => {
    const { update, eq } = mockDeleteUpdate(null);
    await enqueue({ table: 'products', op: 'delete', payload: { id: 'del1' } });

    await drain();

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) })
    );
    expect(eq).toHaveBeenCalledWith('id', 'del1');
    expect(getPendingCount()).toBe(0);
  });

  it('delete op without id → poison (drops + toast)', async () => {
    const { toaster } = await import('@/shared/lib/toaster');
    await enqueue({ table: 'products', op: 'delete', payload: {} });

    await drain();

    expect(getPendingCount()).toBe(0);
    expect(toaster.error).toHaveBeenCalled();
  });

  it('drain skips when navigator.onLine is false', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const upsert = mockUpsert(null);
    await enqueue({ table: 'products', op: 'insert', payload: { id: 'off1' } });

    await drain();

    expect(upsert).not.toHaveBeenCalled();
    expect(getPendingCount()).toBe(1);
  });

  it('idempotency: same client UUID upserts onConflict:id (deduplicates retries)', async () => {
    const upsert = mockUpsert(null);
    await enqueue({ table: 'products', op: 'insert', payload: { id: 'idemp1', name: 'a' } });

    await drain();

    expect(upsert).toHaveBeenCalledWith(
      { id: 'idemp1', name: 'a' },
      { onConflict: 'id' }
    );
  });

  it('primePendingCache keeps records with current APP_VERSION', async () => {
    const { set } = await import('idb-keyval');
    const APP_VERSION = (await import('./persister')).APP_VERSION;
    await set(KEY, [
      {
        qid: 'fresh-1',
        appVersion: APP_VERSION,
        table: 'products',
        op: 'insert' as const,
        payload: { id: 'k1' },
        attempts: 0,
        nextAttemptAt: 0,
      },
    ]);

    await primePendingCache();

    expect(getPendingCount()).toBe(1);
  });

  it('persists across "process restart" (re-prime from IDB)', async () => {
    mockUpsert(null);
    await enqueue({ table: 'products', op: 'insert', payload: { id: 'p-rs1' } });
    expect(getPendingCount()).toBe(1);

    // Симулируем рестарт: подменяем cache (но IDB остаётся).
    await clearPending(); // очищает RAM + IDB; нужно симулировать только RAM-сброс
    // → используем raw IDB запись
    const { set } = await import('idb-keyval');
    const APP_VERSION = (await import('./persister')).APP_VERSION;
    await set(KEY, [
      {
        qid: 'survived',
        appVersion: APP_VERSION,
        table: 'products',
        op: 'insert' as const,
        payload: { id: 'p-rs2' },
        attempts: 0,
        nextAttemptAt: 0,
      },
    ]);

    await primePendingCache();
    expect(getPendingCount()).toBe(1);

    await drain();
    expect(getPendingCount()).toBe(0);
  });

  it('IDB and in-memory cache stay consistent after a sequence of operations', async () => {
    mockUpsert(null);
    await enqueue({ table: 'products', op: 'insert', payload: { id: 'c1' } });
    await enqueue({ table: 'products', op: 'insert', payload: { id: 'c2' } });
    await enqueue({ table: 'products', op: 'insert', payload: { id: 'c3' } });

    const idbBefore = (await get<PendingWrite[]>(KEY)) ?? [];
    expect(idbBefore.length).toBe(getPendingCount());

    await drain();

    const idbAfter = (await get<PendingWrite[]>(KEY)) ?? [];
    expect(idbAfter.length).toBe(getPendingCount());
    expect(idbAfter.length).toBe(0);
  });
});
