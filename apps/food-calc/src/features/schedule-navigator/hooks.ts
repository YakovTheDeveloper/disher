import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { startOfToday } from 'date-fns';
import { db } from '@/shared/lib/dexie/schema';
import type { DateStr } from './model';

export function useToday(): Date {
  return useMemo(() => startOfToday(), []);
}

/**
 * One shared Dexie subscription for the distinct `schedule_foods.date` keys.
 * Returns `undefined` on the first tick (loading), then a string[].
 *
 * НЕ использовать `uniqueKeys()`: под капотом это курсор с направлением
 * `nextunique`, а WebKit на нём кидает `UnknownError: Unable to open cursor`
 * (dexie#1030 / #1052, idb#71) — и, что хуже, дальше залипает вся база до
 * переустановки. Берём обычные ключи (направление `next`) и схлопываем дубли
 * в JS: ключей столько же, сколько строк расписания — цена O(n) по памяти
 * ничтожна против отказа всего IndexedDB на iOS.
 */
export function useFilledDateKeys(): DateStr[] | undefined {
  return useLiveQuery(async () => {
    const keys = (await db.schedule_foods.orderBy('date').keys()) as DateStr[];
    return [...new Set(keys)];
  }, []);
}

export function deriveFilledDates(keys: DateStr[] | undefined): Set<DateStr> {
  return new Set(keys ?? []);
}
