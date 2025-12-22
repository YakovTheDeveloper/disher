import { IObservableArray } from "mobx";
import { Instance, types } from "mobx-state-tree";

export const ItemStatus = types.enumeration([
    "added",
    "modified",
    "deleted",
    "none"
]);

export type ItemStatusType = "added" | "modified" | "deleted" | "none";

export const SyncStatus = types
    .model("SyncStatus", {
        status: types.optional(ItemStatus, "none"),
        lastSync: types.optional(types.string, ""),
    })
    .actions((self) => ({
        markAdded() {
            self.status = "added";
        },
        markModified() {
            const hasLastSync = self.lastSync !== "";

            if (!hasLastSync) {
                self.status = "added";
                return;
            }

            if (self.status === "none") {
                self.status = "modified";
            }
        },

        markDeleted() {
            self.status = "deleted";
        },
        setLastSync(lastSync: string) {
            self.lastSync = lastSync;
        },
        onSync(lastSync: string) {
            self.lastSync = lastSync;
            self.status = 'none'
        },
    }));

export interface ItemWithSync {
    id: string;
    sync: Instance<typeof SyncStatus>;
}

export function deleteChild(
    items: IObservableArray<ItemWithSync>,
    childId: string
) {
    const item = items.find(i => i.id === childId);
    if (!item) return;
    if (!item.sync.lastSync) {
        items.replace(items.filter(i => i.id !== childId));
        return;
    }

    item.sync.markDeleted();
}