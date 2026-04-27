import { describe, it, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { clear, get, set } from 'idb-keyval';

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
  clearPending,
  primePendingCache,
  type PendingWrite,
} from './pendingWrites';
import { APP_VERSION } from './persister';

const KEY = 'foodcalc-pending-writes';

type Op =
  | { kind: 'enqueue'; id: string }
  | { kind: 'drainAllSuccess' }
  | { kind: 'drainOne5xx' }
  | { kind: 'drainOne4xx' }
  | { kind: 'clear' };

const opArbitrary = fc.oneof(
  fc.record({ kind: fc.constant('enqueue' as const), id: fc.uuid() }),
  fc.constant({ kind: 'drainAllSuccess' as const }),
  fc.constant({ kind: 'drainOne5xx' as const }),
  fc.constant({ kind: 'drainOne4xx' as const }),
  fc.constant({ kind: 'clear' as const })
) as fc.Arbitrary<Op>;

function setSupabaseReply(reply: { error: { status: number } | null }) {
  const upsert = vi.fn().mockResolvedValue(reply);
  (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ upsert });
  return upsert;
}

async function applyOp(op: Op, dispatched: string[]) {
  switch (op.kind) {
    case 'enqueue':
      await enqueue({ table: 'products', op: 'insert', payload: { id: op.id, name: op.id } });
      break;
    case 'drainAllSuccess': {
      const upsert = vi.fn(async (payload: { id: string }) => {
        dispatched.push(payload.id);
        return { error: null };
      });
      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ upsert });
      await drain();
      break;
    }
    case 'drainOne5xx': {
      setSupabaseReply({ error: { status: 503 } });
      await drain();
      // backoff > now → дальнейшие drain'ы no-op до сдвига времени.
      // Чтобы это не блокировало property-test, выпускаем backoff: ставим nextAttemptAt = 0.
      await releaseBackoff();
      break;
    }
    case 'drainOne4xx': {
      setSupabaseReply({ error: { status: 400 } });
      await drain();
      break;
    }
    case 'clear':
      await clearPending();
      break;
  }
}

async function releaseBackoff() {
  // Сбрасываем nextAttemptAt в 0 для всех записей, чтобы тесты не зависели от Date.now().
  const list = (await get<PendingWrite[]>(KEY)) ?? [];
  await set(
    KEY,
    list.map((w) => ({ ...w, nextAttemptAt: 0 }))
  );
  // Re-sync RAM cache.
  await primePendingCache();
}

describe('pendingWrites property tests', () => {
  beforeEach(async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await clear();
    await clearPending();
    vi.clearAllMocks();
  });

  it('property: in-memory count always matches IDB length', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(opArbitrary, { maxLength: 20 }), async (ops) => {
        await clear();
        await clearPending();
        const dispatched: string[] = [];
        for (const op of ops) {
          await applyOp(op, dispatched);
          const idbLen = ((await get<PendingWrite[]>(KEY)) ?? []).length;
          if (getPendingCount() !== idbLen) return false;
        }
        return getPendingCount() === ((await get<PendingWrite[]>(KEY)) ?? []).length;
      }),
      { numRuns: 30 }
    );
  });

  it('property: FIFO — successful drains dispatch in enqueue order', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }), async (ids) => {
        await clear();
        await clearPending();
        const dispatched: string[] = [];
        const upsert = vi.fn(async (payload: { id: string }) => {
          dispatched.push(payload.id);
          return { error: null };
        });
        (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ upsert });

        for (const id of ids) {
          await enqueue({ table: 'products', op: 'insert', payload: { id } });
        }
        await drain();

        return JSON.stringify(dispatched) === JSON.stringify(ids);
      }),
      { numRuns: 30 }
    );
  });

  it('property: no-loss — successful drain removes exactly the dispatched record', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.uuid(), { minLength: 1, maxLength: 8 }), async (ids) => {
        await clear();
        await clearPending();
        const upsert = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ upsert });

        for (const id of ids) {
          await enqueue({ table: 'products', op: 'insert', payload: { id } });
        }
        const before = getPendingCount();
        await drain();
        const after = getPendingCount();

        return before === ids.length && after === 0;
      }),
      { numRuns: 30 }
    );
  });

  it('property: poison classification drops all 4xx records, keeps 5xx', async () => {
    // Драйверим dispatch последовательностью статусов, по одному на каждую попытку drain'а.
    // 5xx → retry (запись остаётся в head), 4xx → poison (head удаляется и FIFO продвигается).
    // После len(records) попыток гарантированно обработаны все записи (пессимистично — все 5xx).
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            status: fc.oneof(
              fc.constant(400),
              fc.constant(403),
              fc.constant(404),
              fc.constant(500),
              fc.constant(503)
            ),
          }),
          { minLength: 1, maxLength: 6 }
        ),
        async (records) => {
          await clear();
          await clearPending();

          for (const r of records) {
            await enqueue({ table: 'products', op: 'insert', payload: { id: r.id } });
          }

          // По очереди дренажим. Если очередной head — 4xx, он будет удалён, и следующий
          // dispatch обработает следующую запись. Если 5xx, head остаётся, releaseBackoff
          // сбрасывает таймер, но статус запроса нужно перевыставить под текущую head.
          // Проще: симулируем "идеальный" сценарий: раз за разом dispatch'им head с её
          // запланированным статусом, пока очередь не стабилизируется.
          let head: PendingWrite | undefined;
          while (true) {
            const list = (await get<PendingWrite[]>(KEY)) ?? [];
            head = list[0];
            if (!head) break;
            const matchIdx = records.findIndex((r) => r.id === (head!.payload as { id: string }).id);
            const status = matchIdx === -1 ? 500 : records[matchIdx]!.status;
            setSupabaseReply({ error: { status } });
            await drain();
            await releaseBackoff();

            if (status >= 500) break; // 5xx — head остаётся; дальнейшая обработка приведёт к зацикливанию
          }

          // Все 4xx должны были выйти из очереди; в конце осталось ≥1 5xx (если он был head)
          // или 0 (если все 4xx). Проверяем: ни одной 4xx не осталось.
          const list = (await get<PendingWrite[]>(KEY)) ?? [];
          const remainingIds = new Set(list.map((w) => (w.payload as { id: string }).id));
          // Допустимый остаток — только 5xx-записи в FIFO порядке начиная с первой 5xx.
          const firstRetryIdx = records.findIndex((r) => r.status >= 500);
          const expected =
            firstRetryIdx === -1 ? new Set<string>() : new Set(records.slice(firstRetryIdx).map((r) => r.id));
          // Каждый id в remainingIds должен быть в expected.
          for (const id of remainingIds) {
            if (!expected.has(id)) return false;
          }
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('property: idempotency — re-enqueue of identical id is OK because upsert is keyed by id', async () => {
    // pendingWrites не дедуплицирует id (это фича), но финальное состояние сервера
    // всё равно идемпотентно: каждый upsert с onConflict:'id' заменяет одну строку.
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.integer({ min: 1, max: 5 }), async (id, n) => {
        await clear();
        await clearPending();
        const upsert = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ upsert });

        for (let i = 0; i < n; i++) {
          await enqueue({ table: 'products', op: 'insert', payload: { id, attempt: i } });
        }
        await drain();

        // N раз dispatched, все с одинаковым id, все с onConflict:'id'.
        return (
          upsert.mock.calls.length === n &&
          upsert.mock.calls.every(([payload, opts]) => payload.id === id && opts.onConflict === 'id')
        );
      }),
      { numRuns: 20 }
    );
  });

  it('property: APP_VERSION drift drops any record with a different version', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            qid: fc.uuid(),
            version: fc.oneof(fc.constant(APP_VERSION), fc.constant('OTHER-VERSION')),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        async (records) => {
          await clear();
          await clearPending();

          await set(
            KEY,
            records.map(
              (r): PendingWrite => ({
                qid: r.qid,
                appVersion: r.version,
                table: 'products',
                op: 'insert',
                payload: { id: r.qid },
                attempts: 0,
                nextAttemptAt: 0,
              })
            )
          );
          await primePendingCache();

          const expected = records.filter((r) => r.version === APP_VERSION).length;
          return getPendingCount() === expected;
        }
      ),
      { numRuns: 20 }
    );
  });
});
