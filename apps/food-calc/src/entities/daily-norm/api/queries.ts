import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import type { DailyNorm } from '../model/types';
import { mapDailyNormRow } from './mappers';

function useAllDailyNorms(): DailyNorm[] {
  const rows = useLiveQuery(() => db.daily_norms.toArray(), []);
  return useMemo(() => (rows ?? []).map(mapDailyNormRow), [rows]);
}

export function useDailyNorms(): DailyNorm[] {
  return useAllDailyNorms();
}

export function useDailyNorm(normId: string | undefined): DailyNorm | null {
  const norms = useAllDailyNorms();
  return useMemo(() => {
    if (!normId) return null;
    return norms.find((n) => n.id === normId) ?? null;
  }, [norms, normId]);
}
