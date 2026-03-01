import { makeAutoObservable } from 'mobx';
import { useMemo } from 'react';

class SelectionStore {
  isActionsMode = false;
  selectedIds: string[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  setIsActionsMode = (value: boolean) => {
    this.isActionsMode = value;

    if (!value) {
      this.selectedIds = [];
    }
  };

  toggleSelectedId = (id: string) => {
    const index = this.selectedIds.indexOf(id);

    if (index >= 0) {
      this.selectedIds.splice(index, 1);
    } else {
      this.selectedIds.push(id);
    }

    this.isActionsMode = this.selectedIds.length > 0;
  };

  setSelectedIds = (ids: string[]) => {
    const selectedSet = new Set(this.selectedIds);
    const idsSet = new Set(ids);

    if (ids.every((id) => selectedSet.has(id))) {
      this.selectedIds = this.selectedIds.filter((id) => !idsSet.has(id));
    } else {
      ids.forEach((id) => {
        if (!selectedSet.has(id)) {
          this.selectedIds.push(id);
        }
      });
    }

    this.isActionsMode = this.selectedIds.length > 0;
  };

  clearSelection = () => {
    this.selectedIds = [];
    this.isActionsMode = false;
  };

  isSelected = (id: string) => {
    return this.selectedIds.includes(id);
  };

  get selectedCount() {
    return this.selectedIds.length;
  }
}

export const useSelection = () => {
  return useMemo(() => new SelectionStore(), []);
};

export type SelectionStoreType = SelectionStore;