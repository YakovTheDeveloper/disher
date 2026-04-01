import { useMemo } from "react";
import { queryDb } from "@livestore/livestore";
import { useQuery } from "@livestore/react";
import { tables } from "@/livestore/schema";
import { parseNutrients, parsePortions, type NutrientEntry, type PortionEntry } from "@/shared/lib/parsers";

export type { NutrientEntry, PortionEntry };

export function useProduct(productId: string | undefined) {
  const rows = useQuery(
    queryDb(
      tables.products.where({ id: productId ?? "", deletedAt: null }),
      { label: `product-${productId}`, deps: [productId] },
    ),
  );
  return rows[0] ?? null;
}

const allProducts$ = queryDb(tables.products.where({ deletedAt: null }), { label: 'products' });

export function useProducts(search?: string) {
  const allRows = useQuery(allProducts$);

  return useMemo(() => {
    if (!search) return allRows;
    const lower = search.toLowerCase();
    return allRows.filter((r) =>
      r.name?.toLowerCase().includes(lower) ||
      r.nameEng?.toLowerCase().includes(lower)
    );
  }, [allRows, search]);
}

export function useProductsByIds(productIds: string[]) {
  const rows = useQuery(allProducts$);
  return useMemo(() => {
    if (productIds.length === 0) return [];
    const idSet = new Set(productIds);
    return rows.filter((r) => idSet.has(r.id));
  }, [rows, productIds]);
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
  const rows = useQuery(allProducts$);

  return useMemo(() => {
    const map = new Map<string, NutrientEntry[]>();
    if (productIds.length === 0) return map;
    const idSet = new Set(productIds);
    for (const row of rows) {
      if (!idSet.has(row.id)) continue;
      const entries = parseNutrients(row.nutrients);
      if (entries.length > 0) map.set(row.id, entries);
    }
    return map;
  }, [rows, productIds]);
}

export function useProductPortions(productId: string | undefined) {
  const product = useProduct(productId);
  return useMemo(
    () => parsePortions(product?.portions),
    [product?.portions],
  );
}
