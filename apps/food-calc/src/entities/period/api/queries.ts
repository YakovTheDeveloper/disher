import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PeriodRow } from '@/shared/lib/dexie/schema';

export interface Period {
  id: string;
  name: string;
  colorIndex: number;
  fontFamily: string;
  fontSize: number;
  createdAt: string;
}

function mapRow(row: PeriodRow): Period {
  return {
    id: row.id,
    name: row.name,
    colorIndex: row.color_index,
    fontFamily: row.font_family,
    fontSize: row.font_size,
    createdAt: row.created_at,
  };
}

export function usePeriods(): Period[] {
  const rows = useLiveQuery(() => db.periods.toArray(), []);
  return useMemo(() => (rows ?? []).map(mapRow), [rows]);
}
