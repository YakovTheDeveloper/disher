import { useMemo } from "react";
import { useQuery } from "@powersync/react";
import { snakeToCamel } from "@/shared/lib/rowMapper";
import type { ScheduleFood, ScheduleFoodWithRelations } from "../model/types";

function mapRow(row: Record<string, unknown>): ScheduleFood {
  return snakeToCamel(row) as unknown as ScheduleFood;
}

const SELECT_SF = `
  select id, user_id, date, time, type, quantity, details,
         product_id, dish_id, created_at, updated_at, deleted_at
  from schedule_foods
  where deleted_at is null
`;

function useEnriched(rows: ScheduleFood[]): ScheduleFoodWithRelations[] {
  const { data: productData } = useQuery<Record<string, unknown>>(
    `select id, name, user_id, price_per_kg from products where deleted_at is null`,
  );
  const { data: dishData } = useQuery<Record<string, unknown>>(
    `select id, name from dishes where deleted_at is null`,
  );

  return useMemo(() => {
    const productMap = new Map(
      productData.map((p) => [
        p.id as string,
        { name: p.name as string, userId: (p.user_id as string) ?? null, pricePerKg: (p.price_per_kg as number) ?? null },
      ]),
    );
    const dishMap = new Map(
      dishData.map((d) => [d.id as string, { name: d.name as string }]),
    );
    return rows.map((row) => ({
      ...row,
      product: row.productId ? (productMap.get(row.productId) ?? null) : null,
      dish: row.dishId ? (dishMap.get(row.dishId) ?? null) : null,
    }));
  }, [rows, productData, dishData]);
}

export function useScheduleFoods(date: string | undefined): ScheduleFoodWithRelations[] {
  const { data } = useQuery<Record<string, unknown>>(
    `${SELECT_SF} and date = ?`,
    [date ?? ""],
  );
  const rows = useMemo(() => data.map(mapRow), [data]);
  return useEnriched(rows);
}

export function useScheduleFoodsByDates(dates: string[]): ScheduleFoodWithRelations[] {
  const { data } = useQuery<Record<string, unknown>>(SELECT_SF);
  const filtered = useMemo(() => {
    if (dates.length === 0) return [];
    const dateSet = new Set(dates);
    return data.map(mapRow).filter((r) => dateSet.has(r.date));
  }, [data, dates]);
  return useEnriched(filtered);
}

export function useAllScheduleFoods(): ScheduleFoodWithRelations[] {
  const { data } = useQuery<Record<string, unknown>>(SELECT_SF);
  const rows = useMemo(() => data.map(mapRow), [data]);
  return useEnriched(rows);
}
