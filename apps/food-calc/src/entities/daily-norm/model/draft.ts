import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface DailyNormDraftStore {
  normId: string | null;
  items: Record<string, number>;
  init: (normId: string, items: Record<string, number>) => void;
  setNutrient: (nutrientId: string, value: number) => void;
  clear: () => void;
}

export const useDailyNormDraftStore = create<DailyNormDraftStore>()(
  devtools(
    (set) => ({
      normId: null,
      items: {},
      init: (normId, items) =>
        set({ normId, items: { ...items } }, false, 'init'),
      setNutrient: (nutrientId, value) =>
        set(
          (s) => ({ items: { ...s.items, [nutrientId]: value } }),
          false,
          'setNutrient',
        ),
      clear: () =>
        set({ normId: null, items: {} }, false, 'clear'),
    }),
    { name: 'daily-norm-draft' },
  ),
);
