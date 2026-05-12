import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import type { DailyNormItems } from '../model/types';
import { USER_NORM_ID } from '../model/default-norm';

/** Single user-norm row from Dexie, or undefined while loading / when not yet set up. */
export function useUserNormRow() {
  return useLiveQuery(() => db.daily_norms.get(USER_NORM_ID), []);
}

/** Returns the user-norm items, or null if the user hasn't run the setup wizard yet. */
export function useUserNormItems(): DailyNormItems | null {
  const row = useUserNormRow();
  return useMemo(() => {
    if (!row) return null;
    const raw = row.items;
    if (raw == null) return {};
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) as DailyNormItems; } catch { return {}; }
    }
    return raw as DailyNormItems;
  }, [row]);
}

/** True once the setup wizard has produced a norm. */
export function useHasUserNorm(): boolean {
  return useUserNormRow() !== undefined;
}
