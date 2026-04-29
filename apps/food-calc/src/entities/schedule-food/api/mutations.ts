import { db, type ScheduleFoodRow } from '@/shared/lib/dexie/schema';
import { getUserIdSync } from '@/shared/lib/auth/useUserId';
import { scheduleHot } from '@/shared/lib/sync/scheduler';
import type { ClipboardItem } from '@/shared/model/clipboardStore';

function requireUserId(): string {
  const userId = getUserIdSync();
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

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
  const userId = requireUserId();

  await db.schedule_foods.add({
    id,
    user_id: userId,
    date: params.date,
    time: params.time,
    type: params.type,
    quantity: params.quantity,
    details: params.details ?? '',
    product_id: params.productId ?? null,
    dish_id: params.dishId ?? null,
  } as unknown as ScheduleFoodRow);

  scheduleHot();
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
  scheduleHot();
}

export async function removeScheduleFood(itemId: string): Promise<void> {
  await db.schedule_foods.update(itemId, {
    deleted_at: new Date().toISOString(),
  });
  scheduleHot();
}

export async function removeScheduleFoods(itemIds: string[]): Promise<void> {
  if (itemIds.length === 0) return;
  const now = new Date().toISOString();
  await db.transaction('rw', db.schedule_foods, async () => {
    for (const id of itemIds) {
      await db.schedule_foods.update(id, { deleted_at: now });
    }
  });
  scheduleHot();
}

export async function pasteClipboardItems(
  items: ClipboardItem[],
  targetDate: string,
): Promise<void> {
  if (items.length === 0) return;
  const userId = requireUserId();
  await db.transaction('rw', db.schedule_foods, async () => {
    for (const item of items) {
      await db.schedule_foods.add({
        id: crypto.randomUUID(),
        user_id: userId,
        date: targetDate,
        time: item.time,
        type: item.type,
        quantity: item.quantity,
        details: item.details ?? '',
        product_id: item.productId ?? null,
        dish_id: item.dishId ?? null,
      } as unknown as ScheduleFoodRow);
    }
  });
  scheduleHot();
}
