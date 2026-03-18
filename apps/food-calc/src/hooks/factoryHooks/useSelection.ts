import { createStore, useStore } from 'zustand';
import { useMemo } from 'react';

type SelectionState = {
  isActionsMode: boolean;
  selectedIds: string[];
  setIsActionsMode: (value: boolean) => void;
  toggleSelectedId: (id: string) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
};

const createSelectionStore = () =>
  createStore<SelectionState>((set, get) => ({
    isActionsMode: false,
    selectedIds: [],

    setIsActionsMode: (value) => {
      set({ isActionsMode: value, ...(value ? {} : { selectedIds: [] }) });
    },

    toggleSelectedId: (id) => {
      const { selectedIds } = get();
      const index = selectedIds.indexOf(id);
      const newIds =
        index >= 0 ? selectedIds.filter((sid) => sid !== id) : [...selectedIds, id];
      set({ selectedIds: newIds, isActionsMode: newIds.length > 0 });
    },

    setSelectedIds: (ids) => {
      const { selectedIds } = get();
      const selectedSet = new Set(selectedIds);

      let newIds: string[];
      if (ids.every((id) => selectedSet.has(id))) {
        const idsSet = new Set(ids);
        newIds = selectedIds.filter((id) => !idsSet.has(id));
      } else {
        const merged = new Set([...selectedIds, ...ids]);
        newIds = [...merged];
      }

      set({ selectedIds: newIds, isActionsMode: newIds.length > 0 });
    },

    clearSelection: () => set({ selectedIds: [], isActionsMode: false }),
  }));

export type SelectionStoreType = ReturnType<typeof createSelectionStore>;

export const useSelection = () => {
  return useMemo(() => createSelectionStore(), []);
};

export { useStore };
