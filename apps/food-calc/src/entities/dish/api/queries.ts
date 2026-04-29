import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import { useUserId } from '@/shared/lib/auth/useUserId';
import type { Dish, DishItem, DishPortion } from '../model/types';
import { mapDishRow, mapDishItemRow, mapDishPortionRow } from './mappers';

function useAllDishes(): Dish[] {
  const userId = useUserId();
  const rows = useLiveQuery(async () => {
    if (!userId) return [];
    return db.dishes
      .where('user_id')
      .equals(userId)
      .filter((d) => !d.deleted_at)
      .toArray();
  }, [userId]);
  return useMemo(() => (rows ?? []).map(mapDishRow), [rows]);
}

function useAllDishItems(): DishItem[] {
  const userId = useUserId();
  const rows = useLiveQuery(async () => {
    if (!userId) return [];
    return db.dish_items
      .where('user_id')
      .equals(userId)
      .filter((d) => !d.deleted_at)
      .toArray();
  }, [userId]);
  return useMemo(() => (rows ?? []).map(mapDishItemRow), [rows]);
}

function useAllDishPortions(): DishPortion[] {
  const userId = useUserId();
  const rows = useLiveQuery(async () => {
    if (!userId) return [];
    return db.dish_portions
      .where('user_id')
      .equals(userId)
      .filter((d) => !d.deleted_at)
      .toArray();
  }, [userId]);
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
  const userId = useUserId();
  const productNames = useLiveQuery(async () => {
    if (!userId) return new Map<string, string>();
    const rows = await db.products
      .filter((p) => (p.user_id === userId || p.user_id === null) && !p.deleted_at)
      .toArray();
    return new Map(rows.map((p) => [p.id, p.name]));
  }, [userId]);

  return useMemo(() => {
    const productMap = productNames ?? new Map<string, string>();
    return items.map((item) => ({
      ...item,
      product: item.productId
        ? { name: productMap.get(item.productId) ?? null }
        : null,
    }));
  }, [items, productNames]);
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
