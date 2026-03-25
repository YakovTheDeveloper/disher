import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ClipboardItem = {
  time: string;
  type: 'food' | 'dish';
  quantity: number;
  foodId: string | null;
  dishId: string | null;
  displayName: string;
};

type ClipboardState = {
  items: ClipboardItem[];
  sourceDate: string | null;
  copyToClipboard: (items: ClipboardItem[], sourceDate: string) => void;
  clearClipboard: () => void;
};

export const useClipboardStore = create<ClipboardState>()(
  persist(
    (set) => ({
      items: [],
      sourceDate: null,
      copyToClipboard: (items, sourceDate) => set({ items, sourceDate }),
      clearClipboard: () => set({ items: [], sourceDate: null }),
    }),
    { name: 'clipboard-store' },
  ),
);
