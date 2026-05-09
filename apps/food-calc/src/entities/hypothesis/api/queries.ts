import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import { mapHypothesisRow } from './mappers';
import type { Hypothesis } from '../model/types';

export function useAllHypotheses(): Hypothesis[] {
  const rows = useLiveQuery(() => db.hypotheses.toArray(), []);
  return useMemo(
    () =>
      [...(rows ?? [])]
        .sort((a, b) => (b.saved_at ?? '').localeCompare(a.saved_at ?? ''))
        .map(mapHypothesisRow),
    [rows],
  );
}

// "Я держу в голове" — saved + currently-testing, not closed.
export function useOpenHypotheses(): Hypothesis[] {
  const all = useAllHypotheses();
  return useMemo(() => all.filter((h) => !h.endedAt), [all]);
}

// "Тестирую сейчас" — explicitly started, not closed.
export function useActiveHypotheses(): Hypothesis[] {
  const all = useAllHypotheses();
  return useMemo(
    () => all.filter((h) => h.startedAt && !h.endedAt),
    [all],
  );
}

export function useClosedHypotheses(): Hypothesis[] {
  const all = useAllHypotheses();
  return useMemo(() => all.filter((h) => !!h.endedAt), [all]);
}

export function useHypothesis(id: string | undefined): Hypothesis | null {
  const row = useLiveQuery(async () => {
    if (!id) return null;
    return (await db.hypotheses.get(id)) ?? null;
  }, [id]);
  return useMemo(() => (row ? mapHypothesisRow(row) : null), [row]);
}
