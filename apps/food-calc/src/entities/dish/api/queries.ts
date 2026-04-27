import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase-client";
import { snakeToCamel } from "@/shared/lib/rowMapper";
import { useUserId } from "@/shared/lib/auth/useUserId";
import type { Dish, DishItem, DishPortion } from "../model/types";

const DISH_COLUMNS =
  "id, user_id, name, created_at, updated_at, deleted_at";

const DISH_ITEM_COLUMNS =
  "id, user_id, dish_id, product_id, quantity, created_at, updated_at, deleted_at";

const DISH_PORTION_COLUMNS =
  "id, user_id, dish_id, label, amount, unit, grams, created_at, updated_at, deleted_at";

function mapDish(row: Record<string, unknown>): Dish {
  return snakeToCamel(row) as unknown as Dish;
}

function mapDishItem(row: Record<string, unknown>): DishItem {
  return snakeToCamel(row) as unknown as DishItem;
}

function mapDishPortion(row: Record<string, unknown>): DishPortion {
  return snakeToCamel(row) as unknown as DishPortion;
}

async function fetchAllDishes(): Promise<Dish[]> {
  const { data, error } = await supabase
    .from("dishes")
    .select(DISH_COLUMNS)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((r) => mapDish(r as unknown as Record<string, unknown>));
}

async function fetchAllDishItems(): Promise<DishItem[]> {
  const { data, error } = await supabase
    .from("dish_items")
    .select(DISH_ITEM_COLUMNS)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((r) => mapDishItem(r as unknown as Record<string, unknown>));
}

async function fetchAllDishPortions(): Promise<DishPortion[]> {
  const { data, error } = await supabase
    .from("dish_portions")
    .select(DISH_PORTION_COLUMNS)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((r) => mapDishPortion(r as unknown as Record<string, unknown>));
}

function useAllDishesQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["dishes", "all", userId],
    queryFn: fetchAllDishes,
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

function useAllDishItemsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["dish_items", "all", userId],
    queryFn: fetchAllDishItems,
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

function useAllDishPortionsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["dish_portions", "all", userId],
    queryFn: fetchAllDishPortions,
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

export function useDishes(search?: string): Dish[] {
  const { data } = useAllDishesQuery();
  return useMemo(() => {
    const rows = data ?? [];
    if (!search) return rows;
    const lower = search.toLowerCase();
    return rows.filter((r) => r.name?.toLowerCase().includes(lower));
  }, [data, search]);
}

export function useDish(dishId: string | undefined): Dish | null {
  const { data } = useAllDishesQuery();
  return useMemo(() => {
    if (!dishId || !data) return null;
    return data.find((d) => d.id === dishId) ?? null;
  }, [data, dishId]);
}

export function useDishItems(dishId: string | undefined): DishItem[] {
  const { data } = useAllDishItemsQuery();
  return useMemo(() => {
    if (!dishId || !data) return [];
    return data.filter((r) => r.dishId === dishId);
  }, [data, dishId]);
}

export function useDishItemsWithProducts(dishId: string | undefined) {
  const items = useDishItems(dishId);
  const userId = useUserId();
  const { data: productData } = useQuery({
    queryKey: ["products", "lookup", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .is("deleted_at", null);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; name: string }>;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  return useMemo(() => {
    const productMap = new Map(
      (productData ?? []).map((p) => [p.id, p.name]),
    );
    return items.map((item) => ({
      ...item,
      product: item.productId ? { name: productMap.get(item.productId) ?? null } : null,
    }));
  }, [items, productData]);
}

export function useDishPortions(dishId: string | undefined): DishPortion[] {
  const { data } = useAllDishPortionsQuery();
  return useMemo(() => {
    if (!dishId || !data) return [];
    return data.filter((r) => r.dishId === dishId);
  }, [data, dishId]);
}

export function useDishItemsByDishIds(dishIds: string[]): DishItem[] {
  const { data } = useAllDishItemsQuery();
  return useMemo(() => {
    if (dishIds.length === 0 || !data) return [];
    const idSet = new Set(dishIds);
    return data.filter((r) => idSet.has(r.dishId));
  }, [data, dishIds]);
}
