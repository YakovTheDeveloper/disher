import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PeriodRow } from '@/shared/lib/dexie/schema';
import { useUserId } from '@/shared/lib/auth/useUserId';

export interface Period {
  id: string;
  userId: string;
  name: string;
  colorIndex: number;
  fontFamily: string;
  fontSize: number;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

function mapRow(row: PeriodRow): Period {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    colorIndex: row.color_index,
    fontFamily: row.font_family,
    fontSize: row.font_size,
    createdAt: row.created_at,
    updatedAt: row.client_modified_at ?? row.created_at,
    deletedAt: row.deleted_at,
  };
}

export function usePeriods(): Period[] {
  const userId = useUserId();
  const rows = useLiveQuery(async () => {
    if (!userId) return [];
    return db.periods
      .where('user_id')
      .equals(userId)
      .filter((r) => !r.deleted_at)
      .toArray();
  }, [userId]);
  return useMemo(() => (rows ?? []).map(mapRow), [rows]);
}
