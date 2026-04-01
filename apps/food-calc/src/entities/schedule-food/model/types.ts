import type { tables } from '@/livestore/schema'

/** Base schedule food row from LiveStore (flat, no relations) */
export type ScheduleFood = (typeof tables)['scheduleFoods']['Type'];

/** Schedule food enriched with product/dish data (mapped in queries) */
export type ScheduleFoodWithRelations = ScheduleFood & {
  productId: string;
  product: { name: string; userId: string; pricePerKg?: number } | null;
  dish: { name: string } | null;
};

export type ScheduleFoodType = "food" | "dish";
