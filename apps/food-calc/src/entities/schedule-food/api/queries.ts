import { useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import { catalog, isCatalogId } from '@/shared/data/catalog';
import type {
  ScheduleFood,
  ScheduleFoodWithRelations,
} from '../model/types';
import { mapScheduleFoodRow } from './mappers';

function useAllScheduleFoods(): ScheduleFood[] {
  const rows = useLiveQuery(() => db.schedule_foods.toArray(), []);
  return useMemo(() => (rows ?? []).map(mapScheduleFoodRow), [rows]);
}

type ProductLite = {
  id: string;
  name: string;
  isUserCreated: boolean;
  servingUnit: string | null;
};
type DishLite = { id: string; name: string };

function useProductLookup(): Map<string, ProductLite> {
  const userRows = useLiveQuery(() => db.products.toArray(), []);
  return useMemo(() => {
    const map = new Map<string, ProductLite>();
    for (const r of catalog) {
      map.set(r.id, {
        id: r.id,
        name: r.name,
        isUserCreated: false,
        servingUnit: r.serving_unit ?? null,
      });
    }
    for (const r of userRows ?? []) {
      map.set(r.id, {
        id: r.id,
        name: r.name,
        isUserCreated: !isCatalogId(r.id),
        servingUnit: r.serving_unit ?? null,
      });
    }
    return map;
  }, [userRows]);
}

function useDishLookup(): Map<string, DishLite> {
  const rows = useLiveQuery(() => db.dishes.toArray(), []);
  return useMemo(
    () => new Map((rows ?? []).map((r) => [r.id, { id: r.id, name: r.name }])),
    [rows],
  );
}

// Stable-reference enrich. Without it, every Dexie change forces a fresh
// enriched object for every row → all visible ScheduleFoodItems re-render.
type RowSig = Pick<
  ScheduleFood,
  'date' | 'time' | 'type' | 'quantity' | 'details' | 'productId' | 'dishId'
>;
type EnrichCache = Map<
  string,
  {
    sig: RowSig;
    product: ScheduleFoodWithRelations['product'];
    dish: ScheduleFoodWithRelations['dish'];
    enriched: ScheduleFoodWithRelations;
  }
>;

function sameSig(a: RowSig, b: RowSig): boolean {
  return (
    a.date === b.date &&
    a.time === b.time &&
    a.type === b.type &&
    a.quantity === b.quantity &&
    a.details === b.details &&
    a.productId === b.productId &&
    a.dishId === b.dishId
  );
}

function sameProduct(
  a: ScheduleFoodWithRelations['product'],
  b: ScheduleFoodWithRelations['product'],
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.name === b.name &&
    a.isUserCreated === b.isUserCreated &&
    a.servingUnit === b.servingUnit
  );
}

function sameDish(
  a: ScheduleFoodWithRelations['dish'],
  b: ScheduleFoodWithRelations['dish'],
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.name === b.name;
}

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
      ? {
          name: productLite.name,
          isUserCreated: productLite.isUserCreated,
          servingUnit: productLite.servingUnit,
        }
      : null;
    const dish = row.dishId ? (dishes.get(row.dishId) ?? null) : null;
    const sig: RowSig = {
      date: row.date,
      time: row.time,
      type: row.type,
      quantity: row.quantity,
      details: row.details,
      productId: row.productId,
      dishId: row.dishId,
    };

    const cached = cache.get(row.id);
    if (
      cached &&
      sameSig(cached.sig, sig) &&
      sameProduct(cached.product, product) &&
      sameDish(cached.dish, dish)
    ) {
      next.set(row.id, cached);
      return cached.enriched;
    }

    const enriched: ScheduleFoodWithRelations = { ...row, product, dish };
    next.set(row.id, { sig, product, dish, enriched });
    return enriched;
  });

  cache.clear();
  next.forEach((v, k) => cache.set(k, v));
  return result;
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
