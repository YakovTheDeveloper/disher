import { SyncStatus } from "@/domain/commonListItem";
import { ChildrenController } from "@/domain/shared/ChildrenController";
import { FoodContentProduct } from "@/domain/shared/foodContent/foodContent";
import { NutrientSource } from "@/domain/shared/NutrientSource";

import { aggregateNutrients } from "@/lib/nutrients/aggregateNutrients";
import { getSnapshot, Instance, types } from "mobx-state-tree";

export const DishItem = types.model("DishItem", {
    id: types.identifier,
    quantity: 100,
    foodId: types.string,
    content: FoodContentProduct,
    sync: types.optional(SyncStatus, {})
}).actions((_self) => ({}))

export const DishItemDraft = types.model("DishItemDraft", {
    item: DishItem
}).actions(self => ({
    clearDishItem() {
        self.item.foodId = ""
        self.item.quantity = 100
        self.item.content = FoodContentProduct.create({ foodId: "1", variant: "product" })
    }
}))

export const Dish = types.compose("Dish", types.model({
    id: types.identifier,
    name: types.string,
    description: types.string,
    userId: types.number,
    lastSync: types.optional(types.string, ''),
    draft: DishItemDraft
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
            return self.items.filter(item => item.content.food?.createdByUser) || null;
        },
        get foodWithNoNutrients() {
            return Array.from(new Set(self.items.filter(item => item.content.food?.noNutrients).map(item => item.content.food).filter(Boolean)))
        }
    }))
    .actions(self => {
        function getTotalNutrients(userQuantity: number) {
            return aggregateNutrients(
                self.items.map(item => item.content as unknown as NutrientSource),
                userQuantity,
                self.baseDishWeight
            );
        }

        function addChildFromDraft(draft: Instance<typeof DishItem>) {
            const { quantity, content } = draft;
            self.addChildWithLocalData({
                quantity,
                content: getSnapshot(content)
            })
        }

        function addDishItemFromDraft() {
            const { quantity, content } = self.draft.item;
            if (!content.foodId) return;
            self.addChildWithLocalData({
                quantity,
                content: getSnapshot(content)
            });
            self.draft.clearDishItem();
        }

        function updateName(name: string) {
            self.name = name;
        }
        function setLastSync(sync: string = Date.now().toString()) {
            self.lastSync = sync;
        }

        function changeName(name: string) {
            self.name = name
        }

        function changeDescription(description: string) {
            self.description = description
        }

        return {
            addChildFromDraft,
            addDishItemFromDraft,
            getTotalNutrients,
            changeDescription,
            changeName,
            setLastSync
        };
    })
