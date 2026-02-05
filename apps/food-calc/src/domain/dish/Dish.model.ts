import { SyncStatus } from "@/domain/commonListItem";
import { ChildrenController } from "@/domain/shared/ChildrenController";
import { PortionsController } from "@/domain/shared/PortionsController";
import { ContentControllerDish, ProductContent } from "@/domain/shared/foodContent/foodContent";
import { NutrientSource } from "@/domain/shared/NutrientSource";

import { aggregateNutrients } from "@/lib/nutrients/aggregateNutrients";
import { getSnapshot, Instance, types } from "mobx-state-tree";

export const DishItem = types.compose("DishItem",
    types.model({
        id: types.identifier,
        sync: types.optional(SyncStatus, {})
    }),
    ContentControllerDish
).views(self => ({
    get effectiveQuantity(): number {
        return self.content?.quantity
    },
})).actions(self => ({
    // updateQuantity(quantity: number) {
    //     self.content?.updateQuantity(quantity);
    // },
    // updateContent(id: string) {
    //     self.updateFood(id)
    // }
}))

export const Dish = types.compose("Dish",
    types.model({
        id: types.identifier,
        name: types.string,
        description: types.string,
        userId: types.number,
        lastSync: types.optional(types.string, ''),
    }),
    ChildrenController(DishItem),
    PortionsController()
)
    .views(self => ({
        get itemsLength() {
            return self.items.length
        },
        get isNoItems() {
            return self.items.length === 0
        },
        get baseDishWeight() {
            return self.items.reduce(
                (sum, item) => sum + item.content.quantity,
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
            getTotalNutrients,
            changeDescription,
            changeName,
            setLastSync
        };
    })
