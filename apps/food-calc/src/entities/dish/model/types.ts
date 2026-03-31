import type { tables } from '@/livestore/schema'

type DishRow = (typeof tables)['dishes']['Type']
type DishItemRow = (typeof tables)['dishItems']['Type']

export type Dish = DishRow
export type DishItem = DishItemRow

export type DishWithItems = Dish & {
  items?: Map<string, DishItem>;
};
