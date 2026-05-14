import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { startOfToday } from 'date-fns';
import { db } from '@/shared/lib/dexie/schema';
import type { DateStr } from './model';

export function useToday(): Date {
  return useMemo(() => startOfToday(), []);
}

/**
 * One shared Dexie subscription for `schedule_foods.date` unique keys.
 * Returns `undefined` on the first tick (loading), then a string[].
 */
export function useFilledDateKeys(): DateStr[] | undefined {
  return useLiveQuery(
    () => db.schedule_foods.orderBy('date').uniqueKeys() as Promise<DateStr[]>,
    [],
  );
}

export function deriveFilledDates(keys: DateStr[] | undefined): Set<DateStr> {
  return new Set(keys ?? []);
}
