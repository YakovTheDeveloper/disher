export interface Dish {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface DishItem {
  id: string;
  userId: string;
  dishId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface DishPortion {
  id: string;
  userId: string;
  dishId: string;
  label: string;
  amount: number;
  unit: string;
  grams: number;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export type DishWithItems = Dish & {
  items?: Map<string, DishItem>;
};
