import { useCallback } from 'react';
import type { NutrientTotals } from './nutrients';

export function useNutrientTotals(totals: NutrientTotals) {
  const getValue = useCallback(
    (id: string) => totals[id] ?? 0,
    [totals]
  );
  return { totals, getValue };
}
