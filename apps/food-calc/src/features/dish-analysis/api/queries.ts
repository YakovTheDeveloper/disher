import { useEffect, useState } from 'react';
import { getDishAnalysis } from './storage';
import type { DishAnalysis } from './types';

type UseDishAnalysisResult = {
  data: DishAnalysis | null;
  isLoading: boolean;
};

// One-shot read of the latest analysis for a dish from idb-keyval. The screen
// component owns streaming state separately — this hook just hydrates the
// initial render on mount and stays out of the way after that.
export function useDishAnalysis(dishId: string): UseDishAnalysisResult {
  const [state, setState] = useState<UseDishAnalysisResult>({
    data: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, isLoading: true });
    void getDishAnalysis(dishId).then((data) => {
      if (cancelled) return;
      setState({ data, isLoading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [dishId]);

  return state;
}
