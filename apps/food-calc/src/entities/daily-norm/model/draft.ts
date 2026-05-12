import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { DailyNormItems } from './types';

interface DailyNormDraftStore {
  items: DailyNormItems;
  init: (items: DailyNormItems) => void;
  setNutrient: (nutrientId: string, value: number) => void;
  clear: () => void;
}

export const useDailyNormDraftStore = create<DailyNormDraftStore>()(
  devtools(
    (set) => ({
      items: {},
      init: (items) => set({ items: { ...items } }, false, 'init'),
      setNutrient: (nutrientId, value) =>
        set(
          (s) => ({ items: { ...s.items, [nutrientId]: value } }),
          false,
          'setNutrient',
        ),
      clear: () => set({ items: {} }, false, 'clear'),
    }),
    { name: 'daily-norm-draft' },
  ),
);
