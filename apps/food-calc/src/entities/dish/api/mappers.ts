import type {
  DishRow,
  DishItemRow,
  DishPortionRow,
} from '@/shared/lib/dexie/schema';
import type { Dish, DishItem, DishPortion } from '../model/types';

export function mapDishRow(row: DishRow): Dish {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export function mapDishItemRow(row: DishItemRow): DishItem {
  return {
    id: row.id,
    dishId: row.dish_id,
    productId: row.product_id,
    quantity: row.quantity,
    createdAt: row.created_at,
  };
}

export function mapDishPortionRow(row: DishPortionRow): DishPortion {
  return {
    id: row.id,
    dishId: row.dish_id,
    label: row.label,
    grams: row.grams,
    createdAt: row.created_at,
  };
}
