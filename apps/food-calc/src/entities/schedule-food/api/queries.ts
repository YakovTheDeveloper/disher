import { useMemo } from "react";
import { queryDb } from "@livestore/livestore";
import { useQuery } from "@livestore/react";
import { tables } from "@/livestore/schema";
import type { ScheduleFoodWithRelations } from "../model/types";

const allProducts$ = queryDb(tables.products.where({ deletedAt: null }), { label: 'sf-products' });
const allDishes$ = queryDb(tables.dishes.where({ deletedAt: null }), { label: 'sf-dishes' });

type ProductRow = (typeof tables)['products']['Type'];
type DishRow = (typeof tables)['dishes']['Type'];

function useEnrichedScheduleFoods(rows: readonly Record<string, any>[]): ScheduleFoodWithRelations[] {
  const products = useQuery(allProducts$);
  const dishes = useQuery(allDishes$);

  return useMemo(() => {
    const productMap = new Map<string, ProductRow>(products.map((p) => [p.id, p]));
    const dishMap = new Map<string, DishRow>(dishes.map((d) => [d.id, d]));

    return rows.map((row) => {
      const product = row.productId ? productMap.get(row.productId) ?? null : null;
      const dish = row.dishId ? dishMap.get(row.dishId) ?? null : null;
      return {
        ...row,
        productId: row.productId,
        product: product ? { name: product.name, userId: product.userId, pricePerKg: product.pricePerKg } : null,
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

const allScheduleFoods$ = queryDb(tables.scheduleFoods.where({ deletedAt: null }), { label: 'schedule-foods-all' });

export function useScheduleFoodsByDates(dates: string[]): ScheduleFoodWithRelations[] {
  const rows = useQuery(allScheduleFoods$);
  const filtered = useMemo(() => {
    if (dates.length === 0) return [];
    const dateSet = new Set(dates);
    return rows.filter((r) => dateSet.has(r.date));
  }, [rows, dates]);
  return useEnrichedScheduleFoods(filtered);
}

export function useAllScheduleFoods(): ScheduleFoodWithRelations[] {
  const rows = useQuery(allScheduleFoods$);
  return useEnrichedScheduleFoods(rows);
}
