import { useMemo } from 'react';
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

function enrich(
  rows: ScheduleFood[],
  products: Map<string, ProductLite>,
  dishes: Map<string, DishLite>,
): ScheduleFoodWithRelations[] {
  return rows.map((row) => ({
    ...row,
    product: row.productId
      ? (() => {
          const p = products.get(row.productId);
          return p
            ? { name: p.name, userId: p.userId, pricePerKg: p.pricePerKg }
            : null;
        })()
      : null,
    dish: row.dishId ? (dishes.get(row.dishId) ?? null) : null,
  }));
}

export function useScheduleFoods(
  date: string | undefined,
): ScheduleFoodWithRelations[] {
  const all = useAllScheduleFoods();
  const products = useProductLookup();
  const dishes = useDishLookup();
  return useMemo(() => {
    if (!date) return [];
    const filtered = all.filter((r) => r.date === date);
    return enrich(filtered, products, dishes);
  }, [all, date, products, dishes]);
}

export function useScheduleFoodsByDates(
  dates: string[],
): ScheduleFoodWithRelations[] {
  const all = useAllScheduleFoods();
  const products = useProductLookup();
  const dishes = useDishLookup();
  return useMemo(() => {
    if (dates.length === 0) return [];
    const dateSet = new Set(dates);
    const filtered = all.filter((r) => dateSet.has(r.date));
    return enrich(filtered, products, dishes);
  }, [all, dates, products, dishes]);
}

export function useAllScheduleFoodsList(): ScheduleFoodWithRelations[] {
  const all = useAllScheduleFoods();
  const products = useProductLookup();
  const dishes = useDishLookup();
  return useMemo(
    () => enrich(all, products, dishes),
    [all, products, dishes],
  );
}

// Backwards-compatible alias — was the public name pre-Dexie migration.
export { useAllScheduleFoodsList as useAllScheduleFoods };
