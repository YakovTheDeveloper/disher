import { useMemo } from "react";
import { queryDb } from "@livestore/livestore";
import { useQuery } from "@livestore/react";
import { tables } from "@/livestore/schema";
import type { ScheduleFoodWithRelations } from "../model/types";

const allProducts$ = queryDb(tables.products.where({ deletedAt: null }), { label: 'sf-products' });
const allDishes$ = queryDb(tables.dishes.where({ deletedAt: null }), { label: 'sf-dishes' });

function useEnrichedScheduleFoods(rows: readonly Record<string, any>[]): ScheduleFoodWithRelations[] {
  const products = useQuery(allProducts$);
  const dishes = useQuery(allDishes$);

  return useMemo(() => {
    const productMap = new Map(products.map((p: any) => [p.id, p]));
    const dishMap = new Map(dishes.map((d: any) => [d.id, d]));

    return rows.map((row: any) => {
      const product = row.productId ? productMap.get(row.productId) ?? null : null;
      const dish = row.dishId ? dishMap.get(row.dishId) ?? null : null;
      return {
        ...row,
        foodId: row.productId,
        food: product ? { name: product.name, userId: product.userId, pricePerKg: product.pricePerKg } : null,
        dish: dish ? { name: dish.name } : null,
      };
    });
  }, [rows, products, dishes]);
}

export function useScheduleFoods(date: string | undefined): ScheduleFoodWithRelations[] {
  const rows = useQuery(
    queryDb(
      tables.scheduleFoods.where({ date: date ?? "", deletedAt: null }),
      { label: `schedule-foods-${date}`, deps: [date] },
    ),
  );
  return useEnrichedScheduleFoods(rows);
}

export function useScheduleFoodsByDates(dates: string[]): ScheduleFoodWithRelations[] {
  const rows = useQuery(
    queryDb(
      tables.scheduleFoods.where({ deletedAt: null }),
      { label: 'schedule-foods-all' },
    ),
  );
  const dateSet = new Set(dates);
  const filtered = useMemo(() => rows.filter((r: any) => dateSet.has(r.date)), [rows, dates]);
  return useEnrichedScheduleFoods(filtered);
}

export function useAllScheduleFoods(): ScheduleFoodWithRelations[] {
  const rows = useQuery(
    queryDb(
      tables.scheduleFoods.where({ deletedAt: null }),
      { label: 'all-schedule-foods' },
    ),
  );
  return useEnrichedScheduleFoods(rows);
}
