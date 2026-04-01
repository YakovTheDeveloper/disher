import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface DishItemDraft {
  id: string;
  productId: string;
  quantity: number;
}

interface DishDraftStore {
  draft: DishItemDraft;
  setFood: (productId: string) => void;
  setQuantity: (quantity: number) => void;
  clear: () => void;
}

const DEFAULT: DishItemDraft = {
  id: "DRAFT",
  productId: "0",
  quantity: 100,
};

export const useDishDraftStore = create<DishDraftStore>()(
  devtools(
    (set) => ({
      draft: { ...DEFAULT },
      setFood: (productId) =>
        set((s) => ({ draft: { ...s.draft, productId } }), false, "setFood"),
      setQuantity: (quantity) =>
        set((s) => ({ draft: { ...s.draft, quantity } }), false, "setQuantity"),
      clear: () =>
        set({ draft: { ...DEFAULT } }, false, "clear"),
    }),
    { name: "dish-draft" },
  ),
);
