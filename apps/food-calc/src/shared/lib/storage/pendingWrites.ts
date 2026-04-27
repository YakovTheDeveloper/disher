import { get, update } from 'idb-keyval';
import { supabase } from '@/shared/api/supabase-client';
import { toaster } from '@/shared/lib/toaster';
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

      const result = await dispatch(head);

      if (result === 'success' || result === 'poison') {
        if (result === 'poison') {
          toaster.error(`Не удалось сохранить запись в ${head.table}`);
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
          continue;
        }
        break;
      }
    }
  } finally {
    draining = false;
  }
}

async function dispatch(w: PendingWrite): Promise<'success' | 'poison' | 'retry'> {
  try {
    await supabase.auth.getSession();
  } catch {
    return 'retry';
  }

  let res;
  try {
    if (w.op === 'delete') {
      const id = (w.payload as { id?: string }).id;
      if (!id) return 'poison';
      res = await supabase
        .from(w.table)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
    } else {
      res = await supabase.from(w.table).upsert(w.payload, { onConflict: 'id' });
    }
  } catch {
    return 'retry';
  }

  if (!res.error) return 'success';

  const status = (res.error as { status?: number }).status ?? 0;

  if (status === 401) return 'retry';
  if ([408, 425, 429].includes(status)) return 'retry';
  if (status === 0 || status >= 500) return 'retry';
  if (status >= 400 && status < 500) return 'poison';
  return 'retry';
}
