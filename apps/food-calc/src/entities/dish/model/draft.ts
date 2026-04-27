import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";

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

export const useDishDraftStore = create<DishDraftStore>()(
  devtools(
    persist(
      (set) => ({
        draft: { ...DEFAULT },
        setFood: (productId) =>
          set((s) => ({ draft: { ...s.draft, productId } }), false, "setFood"),
        setQuantity: (quantity) =>
          set((s) => ({ draft: { ...s.draft, quantity } }), false, "setQuantity"),
        clear: () =>
          set({ draft: { ...DEFAULT } }, false, "clear"),
      }),
      {
        name: "dish-draft",
        storage: createJSONStorage(() => idbStorage),
      },
    ),
    { name: "dish-draft" },
  ),
);
