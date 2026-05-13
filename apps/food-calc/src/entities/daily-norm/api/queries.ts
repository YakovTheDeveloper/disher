import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type DailyNormRow } from '@/shared/lib/dexie/schema';
import type { DailyNormItems } from '../model/types';
import { USER_NORM_ID } from '../model/default-norm';

// Sentinel returned by useLiveQuery's defaultResult param while the query
// hasn't resolved yet. Lets callers distinguish "still loading from IDB"
// from "resolved-and-no-row" — both surface as `undefined` from dexie's
// own get(). Without the sentinel the two collapse into a single state
// and a consumer that initialises form draft on mount can race: it sees
// undefined → assumes "no row, use defaults" → useLiveQuery later emits
// the real row → form draft already committed to defaults and missed it.
const LOADING = 'loading' as const;
type Loading = typeof LOADING;
type RowState = Loading | DailyNormRow | undefined;

function useUserNormRowState(): RowState {
  return useLiveQuery(() => db.daily_norms.get(USER_NORM_ID), [], LOADING);
}

/**
 * Single user-norm row from Dexie.
 * `undefined` covers both "still loading" and "no row yet" — backwards
 * compatible with previous behavior. Use `useUserNormItems()` if you need
 * to distinguish loading.
 */
export function useUserNormRow(): DailyNormRow | undefined {
  const r = useUserNormRowState();
  return r === LOADING ? undefined : r;
}

/**
 * User-norm items.
 *   - `undefined` — still loading from IDB
 *   - `null` — IDB resolved, no row (user hasn't run setup yet)
 *   - object — items
 *
 * Callers that init form drafts must skip when `undefined`; otherwise they
 * race with Dexie's first emission and commit the wrong baseline.
 */
export function useUserNormItems(): DailyNormItems | null | undefined {
  const r = useUserNormRowState();
  return useMemo(() => {
    if (r === LOADING) return undefined;
    if (!r) return null;
    const raw = r.items;
    if (raw == null) return {};
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) as DailyNormItems; } catch { return {}; }
    }
    return raw as DailyNormItems;
  }, [r]);
}

/** True once the setup wizard has produced a norm. False while loading or absent. */
export function useHasUserNorm(): boolean {
  const r = useUserNormRowState();
  return r !== LOADING && r !== undefined;
}
