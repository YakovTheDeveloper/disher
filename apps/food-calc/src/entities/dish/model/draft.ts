import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface DishItemDraft {
  id: string;
  foodId: string;
  quantity: number;
}

interface DishDraftStore {
  draft: DishItemDraft;
  setFood: (foodId: string) => void;
  setQuantity: (quantity: number) => void;
  clear: () => void;
}

const DEFAULT: DishItemDraft = {
  id: "DRAFT",
  foodId: "0",
  quantity: 100,
};

export const useDishDraftStore = create<DishDraftStore>()(
  devtools(
    (set) => ({
      draft: { ...DEFAULT },
      setFood: (foodId) =>
        set((s) => ({ draft: { ...s.draft, foodId } }), false, "setFood"),
      setQuantity: (quantity) =>
        set((s) => ({ draft: { ...s.draft, quantity } }), false, "setQuantity"),
      clear: () =>
        set({ draft: { ...DEFAULT } }, false, "clear"),
    }),
    { name: "dish-draft" },
  ),
);
