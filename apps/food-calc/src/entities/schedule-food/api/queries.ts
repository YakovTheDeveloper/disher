import { useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import { useUserId } from '@/shared/lib/auth/useUserId';
import type {
  ScheduleFood,
  ScheduleFoodWithRelations,
} from '../model/types';
import { mapScheduleFoodRow } from './mappers';

function useAllScheduleFoods(): ScheduleFood[] {
  const userId = useUserId();
  const rows = useLiveQuery(async () => {
    if (!userId) return [];
    return db.schedule_foods
      .where('user_id')
      .equals(userId)
      .filter((r) => !r.deleted_at)
      .toArray();
  }, [userId]);
  return useMemo(() => (rows ?? []).map(mapScheduleFoodRow), [rows]);
}

type ProductLite = {
  id: string;
  name: string;
  userId: string | null;
  pricePerKg: number | null;
};
type DishLite = { id: string; name: string };

function useProductLookup(): Map<string, ProductLite> {
  const userId = useUserId();
  const rows = useLiveQuery(async () => {
    if (!userId) return [];
    return db.products
      .filter((p) => (p.user_id === userId || p.user_id === null) && !p.deleted_at)
      .toArray();
  }, [userId]);
  return useMemo(
    () =>
      new Map(
        (rows ?? []).map((r) => [
          r.id,
          {
            id: r.id,
            name: r.name,
            userId: r.user_id,
            pricePerKg: r.price_per_kg ?? null,
          },
        ]),
      ),
    [rows],
  );
}

function useDishLookup(): Map<string, DishLite> {
  const userId = useUserId();
  const rows = useLiveQuery(async () => {
    if (!userId) return [];
    return db.dishes
      .where('user_id')
      .equals(userId)
      .filter((d) => !d.deleted_at)
      .toArray();
  }, [userId]);
  return useMemo(
    () => new Map((rows ?? []).map((r) => [r.id, { id: r.id, name: r.name }])),
    [rows],
  );
}

// Stable-reference enrich: re-uses the previous enriched object when
// (updatedAt, productId, dishId, product-ref, dish-ref) are unchanged.
// Without this, every mutation makes mapScheduleFoodRow allocate fresh `row`
// objects → enrich allocates fresh enriched objects → all 50 ScheduleFoodItems
// re-render even though only one row actually changed.
type EnrichCache = Map<
  string,
  {
    updatedAt: string | null;
    product: ScheduleFoodWithRelations['product'];
    dish: ScheduleFoodWithRelations['dish'];
    enriched: ScheduleFoodWithRelations;
  }
>;

function enrichWithCache(
  rows: ScheduleFood[],
  products: Map<string, ProductLite>,
  dishes: Map<string, DishLite>,
  cache: EnrichCache,
): ScheduleFoodWithRelations[] {
  const next: EnrichCache = new Map();
  const result = rows.map((row) => {
    const productLite = row.productId ? products.get(row.productId) : undefined;
    const product = productLite
      ? { name: productLite.name, userId: productLite.userId, pricePerKg: productLite.pricePerKg }
      : null;
    const dish = row.dishId ? (dishes.get(row.dishId) ?? null) : null;

    const cached = cache.get(row.id);
    if (
      cached &&
      cached.updatedAt === row.updatedAt &&
      sameProduct(cached.product, product) &&
      sameDish(cached.dish, dish)
    ) {
      next.set(row.id, cached);
      return cached.enriched;
    }

    const enriched: ScheduleFoodWithRelations = { ...row, product, dish };
    next.set(row.id, { updatedAt: row.updatedAt, product, dish, enriched });
    return enriched;
  });

  cache.clear();
  next.forEach((v, k) => cache.set(k, v));
  return result;
}

function sameProduct(
  a: ScheduleFoodWithRelations['product'],
  b: ScheduleFoodWithRelations['product'],
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.name === b.name && a.userId === b.userId && a.pricePerKg === b.pricePerKg;
}

function sameDish(
  a: ScheduleFoodWithRelations['dish'],
  b: ScheduleFoodWithRelations['dish'],
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.name === b.name;
}

export function useScheduleFoods(
  date: string | undefined,
): ScheduleFoodWithRelations[] {
  const all = useAllScheduleFoods();
  const products = useProductLookup();
  const dishes = useDishLookup();
  const cacheRef = useRef<EnrichCache>(new Map());
  return useMemo(() => {
    if (!date) return [];
    const filtered = all.filter((r) => r.date === date);
    return enrichWithCache(filtered, products, dishes, cacheRef.current);
  }, [all, date, products, dishes]);
}

export function useScheduleFoodsByDates(
  dates: string[],
): ScheduleFoodWithRelations[] {
  const all = useAllScheduleFoods();
  const products = useProductLookup();
  const dishes = useDishLookup();
  const cacheRef = useRef<EnrichCache>(new Map());
  return useMemo(() => {
    if (dates.length === 0) return [];
    const dateSet = new Set(dates);
    const filtered = all.filter((r) => dateSet.has(r.date));
    return enrichWithCache(filtered, products, dishes, cacheRef.current);
  }, [all, dates, products, dishes]);
}

export function useAllScheduleFoodsList(): ScheduleFoodWithRelations[] {
  const all = useAllScheduleFoods();
  const products = useProductLookup();
  const dishes = useDishLookup();
  const cacheRef = useRef<EnrichCache>(new Map());
  return useMemo(
    () => enrichWithCache(all, products, dishes, cacheRef.current),
    [all, products, dishes],
  );
}

// Backwards-compatible alias — was the public name pre-Dexie migration.
export { useAllScheduleFoodsList as useAllScheduleFoods };
