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

/**
 * Как `useDish`, но различает «ещё грузится из Dexie» и «блюда нет» (удалено /
 * осиротевший id). `useDish` (через `useAllDishes`) коалесит первый undefined-тик
 * liveQuery в `[]`, поэтому там оба случая неотличимы — вечный `null`. Здесь
 * liveQuery оборачивает результат в объект: пока промис не разрешён — `undefined`
 * (loading), после — `{ row }` с найденной строкой ИЛИ `null` (missing). Так
 * DishDrawer отличает ghost-загрузку от «блюдо не найдено».
 */
export function useDishWithStatus(
  dishId: string | undefined,
): { dish: Dish | null; loading: boolean } {
  const result = useLiveQuery(
    async () => {
      if (!dishId) return { row: null };
      const row = await db.dishes.get(dishId);
      return { row: row ?? null };
    },
    [dishId],
  );
  return useMemo(() => {
    if (result === undefined) return { dish: null, loading: true };
    return { dish: result.row ? mapDishRow(result.row) : null, loading: false };
  }, [result]);
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

/**
 * Batch-вариант useDishPortions: один liveQuery по dish_portions, фильтр по
 * множеству dish_id (образец — useDishItemsByDishIds). Для оркестраторов,
 * которым порции нужны сразу по всем блюдам (хуки в цикле нельзя).
 */
export function useDishPortionsByDishIds(dishIds: string[]): DishPortion[] {
  const portions = useAllDishPortions();
  return useMemo(() => {
    if (dishIds.length === 0) return [];
    const idSet = new Set(dishIds);
    return portions.filter((r) => idSet.has(r.dishId));
  }, [portions, dishIds]);
}

// Loading-флаги первого тика liveQuery (rows ещё undefined): оркестраторам,
// которые не должны считать на полупустых входах (useSuggestions,
// useScheduleNutrientTotals). Каждый флаг — своя лёгкая подписка на toArray.
export function useDishesLoading(): boolean {
  return useLiveQuery(() => db.dishes.toArray(), []) === undefined;
}

export function useDishItemsLoading(): boolean {
  return useLiveQuery(() => db.dish_items.toArray(), []) === undefined;
}

export function useDishPortionsLoading(): boolean {
  return useLiveQuery(() => db.dish_portions.toArray(), []) === undefined;
}
