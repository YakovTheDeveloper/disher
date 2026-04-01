import { useMemo } from "react";
import { queryDb } from "@livestore/livestore";
import { useQuery } from "@livestore/react";
import { tables } from "@/livestore/schema";

const allDishes$ = queryDb(tables.dishes.where({ deletedAt: null }), { label: 'dishes' });

export function useDishes(search?: string) {
  const rows = useQuery(allDishes$);
  return useMemo(() => {
    if (!search) return rows;
    const lower = search.toLowerCase();
    return rows.filter((r) => r.name?.toLowerCase().includes(lower));
  }, [rows, search]);
}

export function useDish(dishId: string | undefined) {
  const rows = useQuery(
    queryDb(
      tables.dishes.where({ id: dishId ?? "", deletedAt: null }),
      { label: `dish-${dishId}`, deps: [dishId] },
    ),
  );
  return rows[0] ?? null;
}

export function useDishItems(dishId: string | undefined) {
  return useQuery(
    queryDb(
      tables.dishItems.where({ dishId: dishId ?? "", deletedAt: null }),
      { label: `dish-items-${dishId}`, deps: [dishId] },
    ),
  );
}

export function useDishPortions(dishId: string | undefined) {
  return useQuery(
    queryDb(
      tables.dishPortions.where({ dishId: dishId ?? "", deletedAt: null }),
      { label: `dish-portions-${dishId}`, deps: [dishId] },
    ),
  );
}

const allDishItems$ = queryDb(tables.dishItems.where({ deletedAt: null }), { label: 'dish-items-all' });

export function useDishItemsByDishIds(dishIds: string[]) {
  const rows = useQuery(allDishItems$);
  return useMemo(() => {
    if (dishIds.length === 0) return [];
    const idSet = new Set(dishIds);
    return rows.filter((r) => idSet.has(r.dishId));
  }, [rows, dishIds]);
}
