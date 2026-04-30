import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import { useUserId } from '@/shared/lib/auth/useUserId';
import { parseNutrients, parsePortions, type PortionEntry } from '@/shared/lib/parsers';
import type { NutrientEntry } from '@/shared/lib/nutrients';
import type { Product } from '../model/types';
import { mapProductRow } from './mappers';

export type { NutrientEntry, PortionEntry };

// Catalog rows have user_id IS NULL — visible to everyone, plus the user's own
// rows. Soft-deleted rows (deleted_at != null) are filtered out.
function useAllProducts(): Product[] {
  const userId = useUserId();
  const rows = useLiveQuery(async () => {
    if (!userId) return [];
    const all = await db.products
      .filter((p) => (p.user_id === userId || p.user_id === null) && !p.deleted_at)
      .toArray();
    return all;
  }, [userId]);
  return useMemo(() => (rows ?? []).map(mapProductRow), [rows]);
}

export function useProduct(productId: string | undefined): Product | null {
  const products = useAllProducts();
  return useMemo(() => {
    if (!productId) return null;
    return products.find((p) => p.id === productId) ?? null;
  }, [products, productId]);
}

export function useProducts(search?: string): Product[] {
  const products = useAllProducts();
  return useMemo(() => {
    if (!search) return products;
    const lower = search.toLowerCase();
    return products.filter(
      (r) =>
        r.name?.toLowerCase().includes(lower) ||
        r.nameEng?.toLowerCase().includes(lower),
    );
  }, [products, search]);
}

export function useProductsByIds(productIds: string[]): Product[] {
  const products = useAllProducts();
  return useMemo(() => {
    if (productIds.length === 0) return [];
    const idSet = new Set(productIds);
    return products.filter((r) => idSet.has(r.id));
  }, [products, productIds]);
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
  const products = useAllProducts();
  return useMemo(() => {
    const map = new Map<string, NutrientEntry[]>();
    if (productIds.length === 0) return map;
    const idSet = new Set(productIds);
    for (const row of products) {
      if (!idSet.has(row.id)) continue;
      const entries = parseNutrients(row.nutrients);
      if (entries.length > 0) map.set(row.id, entries);
    }
    return map;
  }, [products, productIds]);
}

export function useProductPortions(productId: string | undefined) {
  const product = useProduct(productId);
  return useMemo(() => parsePortions(product?.portions), [product?.portions]);
}

export const PRODUCTS_QUERY_KEY = ['products', 'all'] as const;
