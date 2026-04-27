import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase-client";
import { snakeToCamel } from "@/shared/lib/rowMapper";
import { parseNutrients, parsePortions, type PortionEntry } from "@/shared/lib/parsers";
import type { NutrientEntry } from "@/shared/lib/nutrients";
import { useUserId } from "@/shared/lib/auth/useUserId";
import type { Product } from "../model/types";

export type { NutrientEntry, PortionEntry };

const PRODUCT_COLUMNS =
  "id, user_id, name, name_eng, description, description_eng, " +
  "source, price_per_kg, nutrients, portions, categories, " +
  "created_at, updated_at, deleted_at";

// Postgres jsonb columns arrive as parsed objects/arrays. Re-stringify them so
// the Product type stays string-shaped and downstream parseNutrients /
// parsePortions / parseCategories continue to work unchanged.
function normalizeJsonField(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function mapProductRow(row: Record<string, unknown>): Product {
  const camel = snakeToCamel(row) as Record<string, unknown>;
  camel.nutrients = normalizeJsonField(camel.nutrients);
  camel.portions = normalizeJsonField(camel.portions);
  camel.categories = normalizeJsonField(camel.categories);
  return camel as unknown as Product;
}

async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((row) => mapProductRow(row as unknown as Record<string, unknown>));
}

/**
 * Single source of useQuery for all visible products (system catalog + user).
 * Sharing one query key prevents N parallel fetches across components and
 * keeps useMemo selectors cheap.
 */
function useAllProductsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["products", "all", userId],
    queryFn: fetchAllProducts,
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

export function useProduct(productId: string | undefined): Product | null {
  const { data } = useAllProductsQuery();
  return useMemo(() => {
    if (!productId || !data) return null;
    return data.find((p) => p.id === productId) ?? null;
  }, [data, productId]);
}

export function useProducts(search?: string): Product[] {
  const { data } = useAllProductsQuery();
  return useMemo(() => {
    const rows = data ?? [];
    if (!search) return rows;
    const lower = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.name?.toLowerCase().includes(lower) ||
        r.nameEng?.toLowerCase().includes(lower),
    );
  }, [data, search]);
}

export function useProductsByIds(productIds: string[]): Product[] {
  const { data } = useAllProductsQuery();
  return useMemo(() => {
    if (productIds.length === 0 || !data) return [];
    const idSet = new Set(productIds);
    return data.filter((r) => idSet.has(r.id));
  }, [data, productIds]);
}

export function useProductNutrients(
  productId: string | undefined,
): { results: NutrientEntry[] } {
  const product = useProduct(productId);
  const results = useMemo(
    () => parseNutrients(product?.nutrients),
    [product?.nutrients],
  );
  return { results };
}

export function useNutrientsByProductIds(
  productIds: string[],
): Map<string, NutrientEntry[]> {
  const { data } = useAllProductsQuery();
  return useMemo(() => {
    const map = new Map<string, NutrientEntry[]>();
    if (productIds.length === 0 || !data) return map;
    const idSet = new Set(productIds);
    for (const row of data) {
      if (!idSet.has(row.id)) continue;
      const entries = parseNutrients(row.nutrients);
      if (entries.length > 0) map.set(row.id, entries);
    }
    return map;
  }, [data, productIds]);
}

export function useProductPortions(productId: string | undefined) {
  const product = useProduct(productId);
  return useMemo(
    () => parsePortions(product?.portions),
    [product?.portions],
  );
}

export const PRODUCTS_QUERY_KEY = ["products", "all"] as const;
