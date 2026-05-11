export type ScheduleFoodType = "food" | "dish";

export interface ScheduleFood {
  id: string;
  date: string;
  time: string;
  type: ScheduleFoodType;
  quantity: number;
  details: string;
  productId: string | null;
  dishId: string | null;
  createdAt: string;
}

export type ScheduleFoodWithRelations = ScheduleFood & {
  product: {
    name: string;
    /** True when the product was created by the user (not a catalog row). */
    isUserCreated: boolean;
    /** null = граммы (food). Иначе единица одной порции (IU/mg/mcg/g/шт). */
    servingUnit?: string | null;
  } | null;
  dish: { name: string } | null;
};
