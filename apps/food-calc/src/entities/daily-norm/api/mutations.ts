import { db, type DailyNormRow } from '@/shared/lib/dexie/schema';
import { getUserIdSync } from '@/shared/lib/auth/useUserId';
import { scheduleCold } from '@/shared/lib/sync/scheduler';
import type { DailyNormItems } from '../model/types';

function requireUserId(): string {
  const userId = getUserIdSync();
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

function safeParseItems(json: string | undefined): DailyNormItems {
  if (!json) return {};
  try {
    return JSON.parse(json) as DailyNormItems;
  } catch {
    return {};
  }
}

export async function createDailyNorm(
  name: string,
  description: string,
  items?: DailyNormItems,
): Promise<string> {
  const id = crypto.randomUUID();
  const userId = requireUserId();
  await db.daily_norms.add({
    id,
    user_id: userId,
    name,
    description,
    items: items ?? {},
  } as unknown as DailyNormRow);
  scheduleCold();
  return id;
}

type DailyNormUpdates = Partial<{
  name: string;
  description: string;
  /** UI passes JSON string; we store the parsed object in Dexie. */
  items: string;
}>;

export async function updateDailyNorm(
  normId: string,
  updates: DailyNormUpdates,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof DailyNormUpdates)[];
  if (keys.length === 0) return;

  const patch: Record<string, unknown> = {};
  for (const k of keys) {
    if (k === 'items') patch.items = safeParseItems(updates.items);
    else patch[k] = updates[k];
  }
  await db.daily_norms.update(normId, patch);
  scheduleCold();
}

export async function deleteDailyNorm(normId: string): Promise<void> {
  await db.daily_norms.update(normId, {
    deleted_at: new Date().toISOString(),
  });
  scheduleCold();
}

export async function setDailyNormNutrient(
  normId: string,
  nutrientId: string,
  quantity: number | null,
  currentItems: DailyNormItems,
): Promise<void> {
  const next = { ...currentItems };
  if (quantity === null || quantity === 0) {
    delete next[nutrientId];
  } else {
    next[nutrientId] = quantity;
  }
  await updateDailyNorm(normId, { items: JSON.stringify(next) });
}
