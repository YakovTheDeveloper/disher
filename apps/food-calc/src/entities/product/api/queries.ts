import { useMemo } from "react";
import { queryDb } from "@livestore/livestore";
import { useQuery } from "@livestore/react";
import { tables } from "@/livestore/schema";

export type NutrientEntry = { nutrientId: string; quantity: number };

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
  const rows = useQuery(allProducts$);
  if (search) {
    const lower = search.toLowerCase();
    return rows.filter((r: any) => r.name?.toLowerCase().includes(lower));
  }
  return rows;
}

export function useProductsByIds(productIds: string[]) {
  const rows = useQuery(
    queryDb(
      tables.products.where({ deletedAt: null }),
      { label: 'products-all-for-filter' },
    ),
  );
  const idSet = new Set(productIds);
  return rows.filter((r: any) => idSet.has(r.id));
}

export function useProductNutrients(productId: string | undefined): { results: NutrientEntry[] } {
  const product = useProduct(productId);
  const results = useMemo(() => {
    if (!product?.nutrients) return [];
    try {
      const parsed = JSON.parse(product.nutrients as string) as Record<string, number>;
      return Object.entries(parsed).map(([nutrientId, quantity]) => ({ nutrientId, quantity }));
    } catch {
      return [];
    }
  }, [product?.nutrients]);
  return { results };
}

export function useNutrientsByFoodIds(foodIds: string[]): Map<string, NutrientEntry[]> {
  const rows = useQuery(
    queryDb(
      tables.products.where({ deletedAt: null }),
      { label: 'products-for-nutrients' },
    ),
  );

  return useMemo(() => {
    const idSet = new Set(foodIds);
    const map = new Map<string, NutrientEntry[]>();
    for (const row of rows) {
      const r = row as any;
      if (!idSet.has(r.id)) continue;
      try {
        const parsed = JSON.parse(r.nutrients) as Record<string, number>;
        map.set(
          r.id,
          Object.entries(parsed).map(([nutrientId, quantity]) => ({ nutrientId, quantity })),
        );
      } catch {
        // skip malformed
      }
    }
    return map;
  }, [rows, foodIds]);
}

export function useProductPortions(productId: string | undefined) {
  const product = useProduct(productId);
  return useMemo(() => {
    if (!product?.portions) return [];
    try {
      return JSON.parse(product.portions as string) as Array<{ label: string; amount: number; unit: string; grams: number }>;
    } catch {
      return [];
    }
  }, [product?.portions]);
}
