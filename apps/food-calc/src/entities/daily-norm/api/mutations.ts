import { db, type DailyNormRow } from '@/shared/lib/dexie/schema';
import type { DailyNormItems } from '../model/types';

const now = () => new Date().toISOString();

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
  const row: DailyNormRow = {
    id,
    name,
    description,
    items: items ?? {},
    created_at: now(),
  };
  await db.daily_norms.add(row);
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
}

export async function deleteDailyNorm(normId: string): Promise<void> {
  await db.daily_norms.delete(normId);
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
