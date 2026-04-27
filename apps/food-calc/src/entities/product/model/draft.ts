import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";

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

const idbStorage = {
  getItem: async (name: string) => {
    const v = await idbGet(name);
    return (v as string | undefined) ?? null;
  },
  setItem: async (name: string, value: string) => {
    await idbSet(name, value);
  },
  removeItem: async (name: string) => {
    await idbDel(name);
  },
};

export const useProductDraftStore = create<ProductDraftStore>()(
  devtools(
    persist(
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
      {
        name: "product-draft",
        storage: createJSONStorage(() => idbStorage),
      },
    ),
    { name: "product-draft" },
  ),
);
