import type { ScheduleFoodRow } from '@/shared/lib/dexie/schema';
import type { ScheduleFood } from '../model/types';

export function mapScheduleFoodRow(row: ScheduleFoodRow): ScheduleFood {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    time: row.time,
    type: row.type,
    quantity: row.quantity,
    details: row.details ?? '',
    productId: row.product_id,
    dishId: row.dish_id,
    createdAt: row.created_at,
    updatedAt: row.client_modified_at ?? row.created_at,
    deletedAt: row.deleted_at,
  };
}
