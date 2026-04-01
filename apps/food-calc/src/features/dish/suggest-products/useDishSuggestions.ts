import { useState, useCallback } from 'react';

export type SuggestionItem = {
  productId: string;
  name: string;
  quantity: number;
};

type SuggestionState = {
  status: 'idle' | 'loading' | 'done' | 'error';
  suggestions: SuggestionItem[];
  error: string | null;
};

const API_BASE = `http://${window.location.hostname}:3100`;

export function useDishSuggestions() {
  const [state, setState] = useState<SuggestionState>({
    status: 'idle',
    suggestions: [],
    error: null,
  });

  const fetchSuggestions = useCallback(
    async (
      dishName: string,
      existingItems: Array<{ productId: string; name: string; quantity: number }> = []
    ) => {
      setState({ status: 'loading', suggestions: [], error: null });

      try {
        const res = await fetch(`${API_BASE}/api/suggestions/dish-products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dishName, existingItems }),
        });

        if (res.status === 429) {
          setState({
            status: 'error',
            suggestions: [],
            error: 'Превышен лимит запросов. Попробуйте позже.',
          });
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        setState({
          status: 'done',
          suggestions: data.suggestions ?? [],
          error: null,
        });
      } catch (err) {
        setState({
          status: 'error',
          suggestions: [],
          error: err instanceof Error ? err.message : 'Неизвестная ошибка',
        });
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ status: 'idle', suggestions: [], error: null });
  }, []);

  return { state, fetchSuggestions, reset };
}
