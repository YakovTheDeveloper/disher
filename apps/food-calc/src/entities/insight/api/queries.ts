import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import { mapInsightRow } from './mappers';
import type { Insight } from '../model/types';

// Newest first — the saved-insights page sorts by time (свежие сверху), the
// same ordering as the hypothesis list.
export function useAllInsights(): Insight[] {
  const rows = useLiveQuery(() => db.insights.toArray(), []);
  return useMemo(
    () =>
      [...(rows ?? [])]
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
        .map(mapInsightRow),
    [rows],
  );
}

export function useInsight(id: string | undefined): Insight | null {
  const row = useLiveQuery(async () => {
    if (!id) return null;
    return (await db.insights.get(id)) ?? null;
  }, [id]);
  return useMemo(() => (row ? mapInsightRow(row) : null), [row]);
}
