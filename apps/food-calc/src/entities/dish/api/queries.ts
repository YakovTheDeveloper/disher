import { useMemo } from "react";
import { useQuery } from "@powersync/react";
import { snakeToCamel } from "@/shared/lib/rowMapper";
import type { Dish, DishItem, DishPortion } from "../model/types";

function mapDish(row: Record<string, unknown>): Dish {
  return snakeToCamel(row) as unknown as Dish;
}

function mapDishItem(row: Record<string, unknown>): DishItem {
  return snakeToCamel(row) as unknown as DishItem;
}

function mapDishPortion(row: Record<string, unknown>): DishPortion {
  return snakeToCamel(row) as unknown as DishPortion;
}

const SELECT_DISH = `
  select id, user_id, name, created_at, updated_at, deleted_at
  from dishes
  where deleted_at is null
`;

const SELECT_DISH_ITEM = `
  select id, user_id, dish_id, product_id, quantity, created_at, updated_at, deleted_at
  from dish_items
  where deleted_at is null
`;

const SELECT_DISH_PORTION = `
  select id, user_id, dish_id, label, amount, unit, grams, created_at, updated_at, deleted_at
  from dish_portions
  where deleted_at is null
`;

export function useDishes(search?: string): Dish[] {
  const { data } = useQuery<Record<string, unknown>>(SELECT_DISH);
  return useMemo(() => {
    const rows = data.map(mapDish);
    if (!search) return rows;
    const lower = search.toLowerCase();
    return rows.filter((r) => r.name?.toLowerCase().includes(lower));
  }, [data, search]);
}

export function useDish(dishId: string | undefined): Dish | null {
  const { data } = useQuery<Record<string, unknown>>(
    `${SELECT_DISH} and id = ?`,
    [dishId ?? ""],
  );
  return data[0] ? mapDish(data[0]) : null;
}

export function useDishItems(dishId: string | undefined): DishItem[] {
  const { data } = useQuery<Record<string, unknown>>(
    `${SELECT_DISH_ITEM} and dish_id = ?`,
    [dishId ?? ""],
  );
  return data.map(mapDishItem);
}

export function useDishItemsWithProducts(dishId: string | undefined) {
  const items = useDishItems(dishId);
  const { data: productData } = useQuery<Record<string, unknown>>(
    `select id, name from products where deleted_at is null`,
  );

  return useMemo(() => {
    const productMap = new Map(
      productData.map((p) => [p.id as string, p.name as string]),
    );
    return items.map((item) => ({
      ...item,
      product: item.productId ? { name: productMap.get(item.productId) ?? null } : null,
    }));
  }, [items, productData]);
}

export function useDishPortions(dishId: string | undefined): DishPortion[] {
  const { data } = useQuery<Record<string, unknown>>(
    `${SELECT_DISH_PORTION} and dish_id = ?`,
    [dishId ?? ""],
  );
  return data.map(mapDishPortion);
}

export function useDishItemsByDishIds(dishIds: string[]): DishItem[] {
  const { data } = useQuery<Record<string, unknown>>(SELECT_DISH_ITEM);
  return useMemo(() => {
    if (dishIds.length === 0) return [];
    const idSet = new Set(dishIds);
    return data.map(mapDishItem).filter((r) => idSet.has(r.dishId));
  }, [data, dishIds]);
}
