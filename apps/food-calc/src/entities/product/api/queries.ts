import { useMemo } from "react";
import { useQuery } from "@powersync/react";
import { snakeToCamel } from "@/shared/lib/rowMapper";
import { parseNutrients, parsePortions, type PortionEntry } from "@/shared/lib/parsers";
import type { NutrientEntry } from "@/shared/lib/nutrients";
import type { Product } from "../model/types";

export type { NutrientEntry, PortionEntry };

const SELECT_PRODUCT = `
  select id, user_id, name, name_eng, description, description_eng,
         source, price_per_kg, nutrients, portions, categories,
         created_at, updated_at, deleted_at
  from products
  where deleted_at is null
`;

function mapProductRow(row: Record<string, unknown>): Product {
  return snakeToCamel(row) as unknown as Product;
}

export function useProduct(productId: string | undefined) {
  const { data } = useQuery<Record<string, unknown>>(
    `${SELECT_PRODUCT} and id = ?`,
    [productId ?? ""],
  );
  return data[0] ? mapProductRow(data[0]) : null;
}

export function useProducts(search?: string): Product[] {
  const { data } = useQuery<Record<string, unknown>>(SELECT_PRODUCT);
  return useMemo(() => {
    const rows = data.map(mapProductRow);
    if (!search) return rows;
    const lower = search.toLowerCase();
    return rows.filter((r) =>
      r.name?.toLowerCase().includes(lower) ||
      r.nameEng?.toLowerCase().includes(lower)
    );
  }, [data, search]);
}

export function useProductsByIds(productIds: string[]): Product[] {
  const { data } = useQuery<Record<string, unknown>>(SELECT_PRODUCT);
  return useMemo(() => {
    if (productIds.length === 0) return [];
    const idSet = new Set(productIds);
    return data
      .map(mapProductRow)
      .filter((r) => idSet.has(r.id));
  }, [data, productIds]);
}

export function useProductNutrients(productId: string | undefined): { results: NutrientEntry[] } {
  const product = useProduct(productId);
  const results = useMemo(
    () => parseNutrients(product?.nutrients),
    [product?.nutrients],
  );
  return { results };
}

export function useNutrientsByProductIds(productIds: string[]): Map<string, NutrientEntry[]> {
  const { data } = useQuery<Record<string, unknown>>(SELECT_PRODUCT);

  return useMemo(() => {
    const map = new Map<string, NutrientEntry[]>();
    if (productIds.length === 0) return map;
    const idSet = new Set(productIds);
    for (const raw of data) {
      const row = mapProductRow(raw);
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
