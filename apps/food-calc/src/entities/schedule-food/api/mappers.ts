import type { ScheduleFoodRow } from '@/shared/lib/dexie/schema';
import type { ScheduleFood } from '../model/types';

export function mapScheduleFoodRow(row: ScheduleFoodRow): ScheduleFood {
  return {
    id: row.id,
    date: row.date,
    time: row.time,
    type: row.type,
    quantity: row.quantity,
    details: row.details ?? '',
    productId: row.product_id,
    dishId: row.dish_id,
    createdAt: row.created_at,
  };
}
