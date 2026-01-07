import { types, Instance } from "mobx-state-tree";

export const GlobalUiStore = types
    .model("GlobalUiStore", {
        isActionsMode: types.boolean,
        selectedIds: types.array(types.string),
    })
    .actions(self => ({
        setIsActionsMode(value: boolean) {
            self.isActionsMode = value;

            if (!value) {
                self.selectedIds.clear();
            }
        },

        toggleSelectedId(id: string) {
            const index = self.selectedIds.indexOf(id);

            if (index >= 0) {
                self.selectedIds.splice(index, 1);
            } else {
                self.selectedIds.push(id);
            }

            self.isActionsMode = self.selectedIds.length > 0;
        },

        clearSelection() {
            self.selectedIds.clear();
            self.isActionsMode = false;
        },
    }))
    .views(self => ({
        isSelected(id: string) {
            return self.selectedIds.includes(id);
        },

        get selectedCount() {
            return self.selectedIds.length;
        },
    }));

export type GlobalUiStoreInstance = Instance<typeof GlobalUiStore>;
