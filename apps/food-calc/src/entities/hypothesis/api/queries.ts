import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import { mapHypothesisRow } from './mappers';
import type { Hypothesis } from '../model/types';

// Newest first. There is no status filter anymore — every hypothesis is just
// a note the user may or may not tick for a given analysis.
export function useAllHypotheses(): Hypothesis[] {
  const rows = useLiveQuery(() => db.hypotheses.toArray(), []);
  return useMemo(
    () =>
      [...(rows ?? [])]
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
        .map(mapHypothesisRow),
    [rows],
  );
}

export function useHypothesis(id: string | undefined): Hypothesis | null {
  const row = useLiveQuery(async () => {
    if (!id) return null;
    return (await db.hypotheses.get(id)) ?? null;
  }, [id]);
  return useMemo(() => (row ? mapHypothesisRow(row) : null), [row]);
}
