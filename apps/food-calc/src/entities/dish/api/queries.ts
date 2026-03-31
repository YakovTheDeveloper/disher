import { queryDb } from "@livestore/livestore";
import { useQuery } from "@livestore/react";
import { tables } from "@/livestore/schema";

const allDishes$ = queryDb(tables.dishes.where({ deletedAt: null }), { label: 'dishes' });

export function useDishes(search?: string) {
  const rows = useQuery(allDishes$);
  if (search) {
    const lower = search.toLowerCase();
    return rows.filter((r: any) => r.name?.toLowerCase().includes(lower));
  }
  return rows;
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
  const rows = useQuery(
    queryDb(
      tables.dishItems.where({ dishId: dishId ?? "", deletedAt: null }),
      { label: `dish-items-${dishId}`, deps: [dishId] },
    ),
  );
  return rows;
}

export function useDishPortions(dishId: string | undefined) {
  const rows = useQuery(
    queryDb(
      tables.dishPortions.where({ dishId: dishId ?? "", deletedAt: null }),
      { label: `dish-portions-${dishId}`, deps: [dishId] },
    ),
  );
  return rows;
}

export function useDishItemsByDishIds(dishIds: string[]) {
  const rows = useQuery(
    queryDb(
      tables.dishItems.where({ deletedAt: null }),
      { label: 'dish-items-all' },
    ),
  );
  const idSet = new Set(dishIds);
  return rows.filter((r: any) => idSet.has(r.dishId));
}
