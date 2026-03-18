import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface ProductDraft {
  id: string;
  time: string;
  variant: "product" | "dish" | null;
  productId: string | null;
  dishId: string | null;
  quantity: number;
}

interface ProductDraftStore {
  draft: ProductDraft;
  setProduct: (productId: string) => void;
  setDish: (dishId: string) => void;
  setTime: (time: string) => void;
  setQuantity: (quantity: number) => void;
  clear: () => void;
}

const DEFAULT: ProductDraft = {
  id: "DRAFT",
  time: "12:00",
  variant: null,
  productId: null,
  dishId: null,
  quantity: 100,
};

export const useProductDraftStore = create<ProductDraftStore>()(
  devtools(
    (set) => ({
      draft: { ...DEFAULT },
      setProduct: (productId) =>
        set(
          (s) => ({ draft: { ...s.draft, variant: "product", productId, dishId: null } }),
          false,
          "setProduct",
        ),
      setDish: (dishId) =>
        set(
          (s) => ({ draft: { ...s.draft, variant: "dish", dishId, productId: null } }),
          false,
          "setDish",
        ),
      setTime: (time) =>
        set((s) => ({ draft: { ...s.draft, time } }), false, "setTime"),
      setQuantity: (quantity) =>
        set((s) => ({ draft: { ...s.draft, quantity } }), false, "setQuantity"),
      clear: () => set({ draft: { ...DEFAULT } }, false, "clear"),
    }),
    { name: "product-draft" },
  ),
);
