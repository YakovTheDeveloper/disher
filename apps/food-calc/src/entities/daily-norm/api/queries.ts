import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import { useUserId } from '@/shared/lib/auth/useUserId';
import type { DailyNorm } from '../model/types';
import { mapDailyNormRow } from './mappers';

function useAllDailyNorms(): DailyNorm[] {
  const userId = useUserId();
  const rows = useLiveQuery(async () => {
    if (!userId) return [];
    return db.daily_norms
      .where('user_id')
      .equals(userId)
      .filter((r) => !r.deleted_at)
      .toArray();
  }, [userId]);
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
