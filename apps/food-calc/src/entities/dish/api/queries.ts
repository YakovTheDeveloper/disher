import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import { catalog } from '@/shared/data/catalog';
import type { Dish, DishItem, DishPortion } from '../model/types';
import { mapDishRow, mapDishItemRow, mapDishPortionRow } from './mappers';

function useAllDishes(): Dish[] {
  const rows = useLiveQuery(() => db.dishes.toArray(), []);
  return useMemo(() => (rows ?? []).map(mapDishRow), [rows]);
}

function useAllDishItems(): DishItem[] {
  const rows = useLiveQuery(() => db.dish_items.toArray(), []);
  return useMemo(() => (rows ?? []).map(mapDishItemRow), [rows]);
}

function useAllDishPortions(): DishPortion[] {
  const rows = useLiveQuery(() => db.dish_portions.toArray(), []);
  return useMemo(() => (rows ?? []).map(mapDishPortionRow), [rows]);
}

export function useDishes(search?: string): Dish[] {
  const dishes = useAllDishes();
  return useMemo(() => {
    if (!search) return dishes;
    const lower = search.toLowerCase();
    return dishes.filter((r) => r.name?.toLowerCase().includes(lower));
  }, [dishes, search]);
}

export function useDish(dishId: string | undefined): Dish | null {
  const dishes = useAllDishes();
  return useMemo(() => {
    if (!dishId) return null;
    return dishes.find((d) => d.id === dishId) ?? null;
  }, [dishes, dishId]);
}

export function useDishItems(dishId: string | undefined): DishItem[] {
  const items = useAllDishItems();
  return useMemo(() => {
    if (!dishId) return [];
    return items.filter((r) => r.dishId === dishId);
  }, [items, dishId]);
}

export function useDishItemsWithProducts(dishId: string | undefined) {
  const items = useDishItems(dishId);
  const userProducts = useLiveQuery(
    () => db.products.toArray().then((rs) => new Map(rs.map((p) => [p.id, p.name]))),
    [],
  );
  const catalogNames = useMemo(
    () => new Map(catalog.map((p) => [p.id, p.name])),
    [],
  );

  return useMemo(() => {
    return items.map((item) => ({
      ...item,
      product: item.productId
        ? {
            name:
              catalogNames.get(item.productId) ??
              userProducts?.get(item.productId) ??
              null,
          }
        : null,
    }));
  }, [items, userProducts, catalogNames]);
}

export function useDishPortions(dishId: string | undefined): DishPortion[] {
  const portions = useAllDishPortions();
  return useMemo(() => {
    if (!dishId) return [];
    return portions.filter((r) => r.dishId === dishId);
  }, [portions, dishId]);
}

export function useDishItemsByDishIds(dishIds: string[]): DishItem[] {
  const items = useAllDishItems();
  return useMemo(() => {
    if (dishIds.length === 0) return [];
    const idSet = new Set(dishIds);
    return items.filter((r) => idSet.has(r.dishId));
  }, [items, dishIds]);
}
