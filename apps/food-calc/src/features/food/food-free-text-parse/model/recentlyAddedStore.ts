import { create } from 'zustand';

type State = {
  ids: Set<string>;
  addMany: (ids: string[]) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useRecentlyAddedStore = create<State>((set) => ({
  ids: new Set(),
  addMany: (newIds) =>
    set((s) => {
      if (newIds.length === 0) return s;
      const next = new Set(s.ids);
      for (const id of newIds) next.add(id);
      return { ids: next };
    }),
  remove: (id) =>
    set((s) => {
      if (!s.ids.has(id)) return s;
      const next = new Set(s.ids);
      next.delete(id);
      return { ids: next };
    }),
  clear: () => set({ ids: new Set() }),
}));
