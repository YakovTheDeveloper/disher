import { useState, useCallback } from 'react';

export const useFilterNutrients = () => {
  const [filterMode, setFilterMode] = useState(false);
  const [hiddenNutrients, setHiddenNutrients] = useState<Set<string>>(new Set());
  const [showValues, setShowValues] = useState(true);
  const [showProgress, setShowProgress] = useState(true);

  const toggleFilterMode = useCallback(() => {
    setFilterMode((prev) => !prev);
  }, []);

  const toggleHidden = useCallback((id: string) => {
    setHiddenNutrients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleShowValues = useCallback(() => setShowValues((v) => !v), []);
  const toggleShowProgress = useCallback(() => setShowProgress((v) => !v), []);

  const isHidden = useCallback((id: string) => hiddenNutrients.has(id), [hiddenNutrients]);

  return {
    filterMode,
    showValues,
    showProgress,
    toggleFilterMode,
    toggleHidden,
    toggleShowValues,
    toggleShowProgress,
    isHidden,
  };
};
