import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase-client";
import { snakeToCamel } from "@/shared/lib/rowMapper";
import { useUserId } from "@/shared/lib/auth/useUserId";
import type { ScheduleFood, ScheduleFoodWithRelations } from "../model/types";

const SF_COLUMNS =
  "id, user_id, date, time, type, quantity, details, " +
  "product_id, dish_id, created_at, updated_at, deleted_at";

function mapRow(row: Record<string, unknown>): ScheduleFood {
  return snakeToCamel(row) as unknown as ScheduleFood;
}

async function fetchAllScheduleFoods(): Promise<ScheduleFood[]> {
  const { data, error } = await supabase
    .from("schedule_foods")
    .select(SF_COLUMNS)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as Record<string, unknown>));
}

function useAllScheduleFoodsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["schedule_foods", "all", userId],
    queryFn: fetchAllScheduleFoods,
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

type ProductLite = { id: string; name: string; userId: string | null; pricePerKg: number | null };
type DishLite = { id: string; name: string };

function useProductLookup() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["products", "lookup", userId],
    queryFn: async (): Promise<ProductLite[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, user_id, price_per_kg")
        .is("deleted_at", null);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id as string,
        name: r.name as string,
        userId: (r.user_id as string | null) ?? null,
        pricePerKg: (r.price_per_kg as number | null) ?? null,
      }));
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

function useDishLookup() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["dishes", "lookup", userId],
    queryFn: async (): Promise<DishLite[]> => {
      const { data, error } = await supabase
        .from("dishes")
        .select("id, name")
        .is("deleted_at", null);
      if (error) throw error;
      return (data ?? []).map((r) => ({ id: r.id as string, name: r.name as string }));
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

function useEnriched(rows: ScheduleFood[]): ScheduleFoodWithRelations[] {
  const { data: products } = useProductLookup();
  const { data: dishes } = useDishLookup();

  return useMemo(() => {
    const productMap = new Map((products ?? []).map((p) => [p.id, p]));
    const dishMap = new Map((dishes ?? []).map((d) => [d.id, d]));
    return rows.map((row) => ({
      ...row,
      product: row.productId
        ? (() => {
            const p = productMap.get(row.productId);
            return p ? { name: p.name, userId: p.userId, pricePerKg: p.pricePerKg } : null;
          })()
        : null,
      dish: row.dishId ? (dishMap.get(row.dishId) ?? null) : null,
    }));
  }, [rows, products, dishes]);
}

export function useScheduleFoods(date: string | undefined): ScheduleFoodWithRelations[] {
  const { data } = useAllScheduleFoodsQuery();
  const filtered = useMemo(() => {
    if (!date || !data) return [] as ScheduleFood[];
    return data.filter((r) => r.date === date);
  }, [data, date]);
  return useEnriched(filtered);
}

export function useScheduleFoodsByDates(dates: string[]): ScheduleFoodWithRelations[] {
  const { data } = useAllScheduleFoodsQuery();
  const filtered = useMemo(() => {
    if (dates.length === 0 || !data) return [] as ScheduleFood[];
    const dateSet = new Set(dates);
    return data.filter((r) => dateSet.has(r.date));
  }, [data, dates]);
  return useEnriched(filtered);
}

export function useAllScheduleFoods(): ScheduleFoodWithRelations[] {
  const { data } = useAllScheduleFoodsQuery();
  const rows = useMemo(() => data ?? [], [data]);
  return useEnriched(rows);
}
