import { deleteChild as deleteChildFromList, ItemStatus, ItemStatusType, SyncStatus } from "@/domain/commonListItem";
import { Food } from "@/domain/Food";
import { ChildrenController } from "@/domain/shared/ChildrenController";
import { generateId } from "@/lib/id/generateId";
import { sumRecordArray, sumRecords } from "@/lib/sumRecords/sumRecords";
import { destroy, getParent, getRoot, Instance, SnapshotIn, types } from "mobx-state-tree";

export const DishItem = types.model("DishItem", {
    id: types.identifier,
    quantity: types.number,
    foodId: types.string,
    food: types.reference(Food, {
        get(identifier, parent) {
            const root = getRoot(parent); // <-- MST helper to get the tree root
            console.log("root", root);
            return root.foodStore?.data.get(identifier);
        },
        set(value) {
            return value.id; // MST needs to know how to store reference
        }
    }),
    sync: types.optional(SyncStatus, {})
}).actions(self => ({

}))

// Dish
export const Dish = types.compose("Dish", types.model({
    id: types.identifier,
    name: types.string,
    userId: types.number,
    lastSync: types.optional(types.string, '')
}), ChildrenController(DishItem))
    .views(self => ({
        get itemsLength() {
            return self.items.length
        },
        get isNoItems() {
            return self.items.length === 0
        },
        get baseDishWeight() {
            return self.items.reduce(
                (sum, { quantity }) => sum + quantity,
                0
            );
        }
    })).views(self => ({

        get foodWithNoNutrients() {
            return Array.from(new Set(self.items.filter(item => item.food.noNutrients).map(item => item.food)))
        }
    }))
    .actions(self => {
        function getTotalNutrients(userQuantity: number) {
            const nutrients = self.items.map(({ food }) => food.getTotalNutrients(userQuantity));
            const acc = sumRecordArray(nutrients)
            const scaleFactor = userQuantity / self.baseDishWeight;
            Object.keys(acc).forEach(key => {
                acc[key] = acc[key] * scaleFactor;
            });
            return acc;
        }

        function updateName(name: string) {
            self.name = name;
        }
        function setLastSync(sync: string = Date.now().toString()) {
            self.lastSync = sync;
        }

        return {
            getTotalNutrients,
            updateName,
            setLastSync
        };
    })
