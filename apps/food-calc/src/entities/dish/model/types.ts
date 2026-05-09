export interface Dish {
  id: string;
  name: string;
  createdAt: string;
}

export interface DishItem {
  id: string;
  dishId: string;
  productId: string;
  quantity: number;
  createdAt: string;
}

export interface DishPortion {
  id: string;
  dishId: string;
  label: string;
  amount: number;
  unit: string;
  grams: number;
  createdAt: string;
}

export type DishWithItems = Dish & {
  items?: Map<string, DishItem>;
};
