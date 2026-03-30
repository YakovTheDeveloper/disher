/** Base schedule food row from LiveStore */
export type ScheduleFood = {
  id: string;
  date: string;
  userId: string;
  quantity: number;
  type: string; // 'food' | 'dish'
  time: string;
  details: string;
  productId: string;
  dishId: string;
  deletedAt: number | null;
  // Compatibility aliases (mapped in queries)
  foodId?: string | null;
  food?: { name: string; userId: string; pricePerKg?: number } | null;
  dish?: { name: string } | null;
};

/** Alias — LiveStore has no relations, flat rows only */
export type ScheduleFoodWithRelations = ScheduleFood;

export type ScheduleFoodType = "food" | "dish";
