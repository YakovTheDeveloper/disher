import { SyncStatus } from "@/domain/commonListItem";
import { ItemContent } from "@/domain/schedule/schedule";
import { ChildrenController } from "@/domain/shared/ChildrenController";
import { sumRecordArray } from "@/lib/sumRecords/sumRecords";
import { getSnapshot, Instance, types } from "mobx-state-tree";

export const DishItem = types.model("DishItem", {
    id: types.identifier,
    quantity: types.number,
    content: types.optional(ItemContent, { variant: 'custom' }),
    sync: types.optional(SyncStatus, {})
}).actions(self => ({

}))

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
        },
        get customItems() {
            return self.items.filter(i => i.content.variant === 'custom') || null;
        },
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

        function addDraftChild(draft: Instance<typeof DishItem>) {
            const { quantity, content } = draft;
            self.addChildWithLocalData({
                quantity,
                content: getSnapshot(content)
            })
        }

        function updateName(name: string) {
            self.name = name;
        }
        function setLastSync(sync: string = Date.now().toString()) {
            self.lastSync = sync;
        }

        return {
            addDraftChild,
            getTotalNutrients,
            updateName,
            setLastSync
        };
    })
