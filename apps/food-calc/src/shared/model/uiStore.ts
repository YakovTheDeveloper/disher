import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UiState = {
  scheduleFoodsShowPrice: boolean;
  setScheduleFoodsShowPrice: (value: boolean) => void;
  toggleScheduleFoodsShowPrice: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      scheduleFoodsShowPrice: false,
      setScheduleFoodsShowPrice: (value) => set({ scheduleFoodsShowPrice: value }),
      toggleScheduleFoodsShowPrice: () =>
        set((s) => ({ scheduleFoodsShowPrice: !s.scheduleFoodsShowPrice })),
    }),
    {
      name: 'ui-store',
    }
  )
);
