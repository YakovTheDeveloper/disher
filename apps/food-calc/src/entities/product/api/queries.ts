import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import { catalog } from '@/shared/data/catalog';
import { parseNutrients, parsePortions, type PortionEntry } from '@/shared/lib/parsers';
import type { NutrientEntry } from '@/shared/lib/nutrients';
import type { Product } from '../model/types';
import { mapProductRow } from './mappers';

export type { NutrientEntry, PortionEntry };

// Merged catalog + user-products view. Catalog is a build artifact (no
// IndexedDB roundtrip); user rows come from Dexie via useLiveQuery.
function useAllProducts(): Product[] {
  const userRows = useLiveQuery(() => db.products.toArray(), []);
  const catalogProducts = useMemo(() => catalog.map(mapProductRow), []);
  return useMemo(() => {
    const userProducts = (userRows ?? []).map(mapProductRow);
    return [...catalogProducts, ...userProducts];
  }, [catalogProducts, userRows]);
}

export function useProduct(productId: string | undefined): Product | null {
  const products = useAllProducts();
  return useMemo(() => {
    if (!productId) return null;
    return products.find((p) => p.id === productId) ?? null;
  }, [products, productId]);
}

/**
 * Как `useProduct`, но различает «ещё грузится из Dexie» и «продукта нет»
 * (удалён / осиротевший id). `useProduct` коалесит первый undefined-тик
 * liveQuery в `[]`, поэтому там оба случая неотличимы — вечный `null`. Здесь
 * пока user-строки не приехали и в каталоге (sync build-артефакт) продукта нет —
 * `loading: true`. Так ProductDrawer отличает ghost-загрузку от «продукт не
 * найден» (зеркало `useDishWithStatus`).
 */
export function useProductWithStatus(
  productId: string | undefined,
): { product: Product | null; loading: boolean } {
  const userRows = useLiveQuery(() => db.products.toArray(), []);
  const catalogProducts = useMemo(() => catalog.map(mapProductRow), []);
  return useMemo(() => {
    if (!productId) return { product: null, loading: false };
    const userProduct = userRows?.map(mapProductRow).find((p) => p.id === productId);
    if (userProduct) return { product: userProduct, loading: false };
    const catalogHit = catalogProducts.find((p) => p.id === productId);
    if (catalogHit) return { product: catalogHit, loading: false };
    return { product: null, loading: userRows === undefined };
  }, [catalogProducts, userRows, productId]);
}

export function useProducts(search?: string): Product[] {
  const products = useAllProducts();
  return useMemo(() => {
    if (!search) return products;
    const lower = search.toLowerCase();
    return products.filter((r) => r.name?.toLowerCase().includes(lower));
  }, [products, search]);
}

/** True на первом тике liveQuery (user-строки ещё undefined) — гейт для
 *  оркестраторов, которые не должны считать на полупустом каталоге. */
export function useProductsLoading(): boolean {
  return useLiveQuery(() => db.products.toArray(), []) === undefined;
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

/**
 * Map of productId → servingBasis. Schedule/product nutrient calculators need
 * this to choose between scale = quantity / 100 (food, default) and
 * scale = quantity (supplements). Products absent from the map fall back to
 * '100g' at the call site.
 */
export function useBasisByProductIds(
  productIds: string[],
): Map<string, '100g' | 'serving'> {
  const products = useAllProducts();
  return useMemo(() => {
    const map = new Map<string, '100g' | 'serving'>();
    if (productIds.length === 0) return map;
    const idSet = new Set(productIds);
    for (const row of products) {
      if (!idSet.has(row.id)) continue;
      map.set(row.id, row.servingBasis);
    }
    return map;
  }, [products, productIds]);
}

export function useProductPortions(productId: string | undefined) {
  const product = useProduct(productId);
  return useMemo(() => parsePortions(product?.portions), [product?.portions]);
}

export const PRODUCTS_QUERY_KEY = ['products', 'all'] as const;
