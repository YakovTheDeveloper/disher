export type ScheduleFoodType = "food" | "dish";

export interface ScheduleFood {
  id: string;
  userId: string;
  date: string;
  time: string;
  type: ScheduleFoodType;
  quantity: number;
  details: string | null;
  productId: string | null;
  dishId: string | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export type ScheduleFoodWithRelations = ScheduleFood & {
  product: { name: string; userId: string | null; pricePerKg?: number | null } | null;
  dish: { name: string } | null;
};
