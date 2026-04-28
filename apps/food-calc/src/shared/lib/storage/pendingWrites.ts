import { get, update } from 'idb-keyval';
import { supabase } from '@/shared/api/supabase-client';
import { toaster } from '@/shared/lib/toaster';
import { queryClient } from '@/shared/lib/storage/queryClient';
import { Sentry } from '@/shared/lib/observability/sentry';
import { APP_VERSION } from './persister';

const KEY = 'foodcalc-pending-writes';
const MAX_ATTEMPTS = 10;
const BACKOFF_CAP_MS = 30_000;

export type PendingOp = 'insert' | 'update' | 'upsert' | 'delete';

export type PendingWrite = {
  qid: string;
  appVersion: string;
  table: string;
  op: PendingOp;
  payload: Record<string, unknown>;
  attempts: number;
  nextAttemptAt: number;
};

let cache: PendingWrite[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function subscribePending(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getPendingCount(): number {
  return cache.length;
}

export async function primePendingCache(): Promise<void> {
  let droppedCount = 0;
  await update<PendingWrite[]>(KEY, (list = []) => {
    const fresh = (list ?? []).filter((w) => w.appVersion === APP_VERSION);
    droppedCount = (list ?? []).length - fresh.length;
    cache = fresh;
    return fresh;
  });
  emit();
  if (droppedCount > 0) {
    toaster.warning(
      `После обновления приложения ${droppedCount} несохранённых записей было отброшено.`
    );
  }
}

export async function enqueue(
  w: Pick<PendingWrite, 'table' | 'op' | 'payload'>
): Promise<void> {
  await update<PendingWrite[]>(KEY, (list = []) => {
    const next: PendingWrite[] = [
      ...(list ?? []),
      {
        ...w,
        qid: crypto.randomUUID(),
        appVersion: APP_VERSION,
        attempts: 0,
        nextAttemptAt: 0,
      },
    ];
    cache = next;
    return next;
  });
  emit();
}

export async function enqueueMany(
  writes: Array<Pick<PendingWrite, 'table' | 'op' | 'payload'>>
): Promise<void> {
  if (writes.length === 0) return;
  await update<PendingWrite[]>(KEY, (list = []) => {
    const additions: PendingWrite[] = writes.map((w) => ({
      ...w,
      qid: crypto.randomUUID(),
      appVersion: APP_VERSION,
      attempts: 0,
      nextAttemptAt: 0,
    }));
    const next = [...(list ?? []), ...additions];
    cache = next;
    return next;
  });
  emit();
}

export async function clearPending(): Promise<void> {
  await update<PendingWrite[]>(KEY, () => {
    cache = [];
    return [];
  });
  emit();
}

let draining = false;

export async function drain(): Promise<void> {
  if (draining || !navigator.onLine) return;
  draining = true;
  try {
    while (true) {
      const list = (await get<PendingWrite[]>(KEY)) ?? [];
      const head = list[0];
      if (!head) break;
      if (head.nextAttemptAt > Date.now()) break;

      const { result, status } = await dispatch(head);

      if (result === 'success' || result === 'poison') {
        if (result === 'poison') {
          toaster.error(`Не удалось сохранить запись в ${head.table}`);
          Sentry.captureMessage('outbox.poison', {
            level: 'warning',
            tags: { table: head.table, op: head.op, status: String(status) },
            extra: {
              qid: head.qid,
              attempts: head.attempts,
              payloadKeys: Object.keys(head.payload),
            },
            fingerprint: ['outbox-poison', head.table, String(status)],
          });
          // Drop the optimistic copy from the UI — the row will not reach the
          // server, so the cache is now stale (план: «Точки отказа», invariant 10).
          void queryClient.invalidateQueries({ queryKey: [head.table] });
        }
        await update<PendingWrite[]>(KEY, (curr = []) => {
          const next = (curr ?? []).filter((x) => x.qid !== head.qid);
          cache = next;
          return next;
        });
        emit();
      } else {
        const isExhausted = head.attempts + 1 >= MAX_ATTEMPTS;
        await update<PendingWrite[]>(KEY, (curr = []) => {
          const next = (curr ?? [])
            .map((x) => {
              if (x.qid !== head.qid) return x;
              if (isExhausted) return null;
              const nextAttempts = x.attempts + 1;
              const backoff = Math.min(BACKOFF_CAP_MS, 1000 * 2 ** x.attempts);
              return { ...x, attempts: nextAttempts, nextAttemptAt: Date.now() + backoff };
            })
            .filter((x): x is PendingWrite => x !== null);
          cache = next;
          return next;
        });
        emit();
        if (isExhausted) {
          toaster.error(
            `Не удалось сохранить запись в ${head.table} после ${MAX_ATTEMPTS} попыток.`
          );
          Sentry.captureMessage('outbox.exhausted', {
            level: 'error',
            tags: { table: head.table, op: head.op },
            extra: { attempts: MAX_ATTEMPTS, qid: head.qid },
            fingerprint: ['outbox-exhausted', head.table],
          });
          // Same reasoning as poison — UI must drop the optimistic copy.
          void queryClient.invalidateQueries({ queryKey: [head.table] });
          continue;
        }
        break;
      }
    }
  } finally {
    draining = false;
  }
}

type DispatchResult = {
  result: 'success' | 'poison' | 'retry';
  status: number;
};

async function dispatch(w: PendingWrite): Promise<DispatchResult> {
  try {
    await supabase.auth.getSession();
  } catch {
    return { result: 'retry', status: 0 };
  }

  let res;
  try {
    if (w.op === 'delete') {
      const id = (w.payload as { id?: string }).id;
      if (!id) return { result: 'poison', status: 0 };
      res = await supabase
        .from(w.table)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
    } else {
      res = await supabase.from(w.table).upsert(w.payload, { onConflict: 'id' });
    }
  } catch {
    return { result: 'retry', status: 0 };
  }

  if (!res.error) return { result: 'success', status: 200 };

  const status = (res.error as { status?: number }).status ?? 0;

  if (status === 401) return { result: 'retry', status };
  if ([408, 425, 429].includes(status)) return { result: 'retry', status };
  if (status === 0 || status >= 500) return { result: 'retry', status };
  if (status >= 400 && status < 500) return { result: 'poison', status };
  return { result: 'retry', status };
}
