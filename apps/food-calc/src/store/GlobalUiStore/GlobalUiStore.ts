import { types, Instance } from "mobx-state-tree";
import { ModalStore } from "./ModalStore/ModalStore";
import { DrawerStore } from "./DrawerStore/DrawerStore";
import { ScrollStore } from "./ScrollStore/ScrollStore";
import { UIViewOptions } from "./UiViewOptions/UIViewOptions";

export const GlobalUiStore = types
    .model("GlobalUiStore", {
        isActionsMode: types.boolean,
        selectedIds: types.array(types.string),
        modalStore: types.optional(ModalStore, {}),
        drawerStore: types.optional(DrawerStore, {}),
        scrollStore: types.optional(ScrollStore, {}),
        options: types.optional(UIViewOptions, {}),
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

        setSelectedIds(ids: string[]) {
            const selectedSet = new Set(self.selectedIds);
            const idsSet = new Set(ids);

            if (ids.every(id => selectedSet.has(id))) {
                self.selectedIds.replace(self.selectedIds.filter(id => !idsSet.has(id)));
            } else {
                ids.forEach(id => {
                    if (!selectedSet.has(id)) {
                        self.selectedIds.push(id);
                    }
                });
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
