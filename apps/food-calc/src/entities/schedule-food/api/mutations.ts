import { db, type ScheduleFoodRow } from '@/shared/lib/dexie/schema';
import type { ClipboardItem } from '@/shared/model/clipboardStore';

const now = () => new Date().toISOString();

export async function addScheduleFood(params: {
  date: string;
  time: string;
  type: 'food' | 'dish';
  quantity: number;
  productId?: string | null;
  dishId?: string | null;
  details?: string | null;
}): Promise<string> {
  const hasProductId = params.productId != null;
  const hasDishId = params.dishId != null;
  if (hasProductId && hasDishId) {
    throw new Error('addScheduleFood: cannot set both productId and dishId');
  }
  if (!hasProductId && !hasDishId) {
    throw new Error('addScheduleFood: must set either productId or dishId');
  }

  const id = crypto.randomUUID();
  const row: ScheduleFoodRow = {
    id,
    date: params.date,
    time: params.time,
    type: params.type,
    quantity: params.quantity,
    details: params.details ?? '',
    product_id: params.productId ?? null,
    dish_id: params.dishId ?? null,
    created_at: now(),
  };
  await db.schedule_foods.add(row);
  return id;
}

type ScheduleFoodUpdates = Partial<{
  date: string;
  time: string;
  type: 'food' | 'dish';
  quantity: number;
  details: string | null;
  productId: string | null;
  dishId: string | null;
}>;

const COLUMN_MAP: Record<keyof ScheduleFoodUpdates, string> = {
  date: 'date',
  time: 'time',
  type: 'type',
  quantity: 'quantity',
  details: 'details',
  productId: 'product_id',
  dishId: 'dish_id',
};

export async function updateScheduleFood(
  itemId: string,
  updates: ScheduleFoodUpdates,
): Promise<void> {
  if (updates.productId !== undefined && updates.dishId !== undefined) {
    const hasProductId = updates.productId != null;
    const hasDishId = updates.dishId != null;
    if (hasProductId && hasDishId) {
      throw new Error(
        'updateScheduleFood: cannot set both productId and dishId',
      );
    }
    if (!hasProductId && !hasDishId) {
      throw new Error(
        'updateScheduleFood: must set either productId or dishId',
      );
    }
  }

  const keys = Object.keys(updates) as (keyof ScheduleFoodUpdates)[];
  if (keys.length === 0) return;

  const patch: Record<string, unknown> = {};
  for (const k of keys) {
    const col = COLUMN_MAP[k];
    if (k === 'details') patch[col] = updates.details ?? '';
    else patch[col] = updates[k] ?? null;
  }

  await db.schedule_foods.update(itemId, patch);
}

export async function removeScheduleFood(itemId: string): Promise<void> {
  await db.schedule_foods.delete(itemId);
}

export async function removeScheduleFoods(itemIds: string[]): Promise<void> {
  if (itemIds.length === 0) return;
  await db.schedule_foods.bulkDelete(itemIds);
}

export async function pasteClipboardItems(
  items: ClipboardItem[],
  targetDate: string,
): Promise<void> {
  if (items.length === 0) return;
  const stamped = now();
  const rows: ScheduleFoodRow[] = items.map((item) => ({
    id: crypto.randomUUID(),
    date: targetDate,
    time: item.time,
    type: item.type,
    quantity: item.quantity,
    details: item.details ?? '',
    product_id: item.productId ?? null,
    dish_id: item.dishId ?? null,
    created_at: stamped,
  }));
  await db.schedule_foods.bulkAdd(rows);
}
