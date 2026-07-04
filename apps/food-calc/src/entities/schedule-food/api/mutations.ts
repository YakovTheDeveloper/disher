import { db, type ScheduleFoodRow } from '@/shared/lib/dexie/schema';
import {
  putRow,
  updateRow,
  deleteRow,
} from '@/shared/lib/dexie/write';
const now = () => new Date().toISOString();

export async function addScheduleFood(params: {
  date: string;
  time: string;
  type: 'food' | 'dish';
  quantity: number;
  productId?: string | null;
  dishId?: string | null;
  details?: string | null;
  /** Опциональный id ряда. Позволяет вызвавшему сгенерить id ЗАРАНЕЕ и пометить
   *  ряд «только что добавлен» (markAdded) ДО записи — иначе liveQuery смонтирует
   *  ряд на коммите раньше, чем прилетит флаг, и появление проскочит. */
  id?: string;
}): Promise<string> {
  const hasProductId = params.productId != null;
  const hasDishId = params.dishId != null;
  if (hasProductId && hasDishId) {
    throw new Error('addScheduleFood: cannot set both productId and dishId');
  }
  if (!hasProductId && !hasDishId) {
    throw new Error('addScheduleFood: must set either productId or dishId');
  }

  const id = params.id ?? crypto.randomUUID();
  const row: Omit<ScheduleFoodRow, 'updated_at'> = {
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
  await putRow(db.schedule_foods, row);
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

  await updateRow(db.schedule_foods, itemId, patch);
}

export async function removeScheduleFood(itemId: string): Promise<void> {
  await deleteRow(db.schedule_foods, itemId);
}
