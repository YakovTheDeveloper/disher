import { SyncStatus } from "@/domain/commonListItem";
import { ChildrenController } from "@/domain/shared/ChildrenController";
import { PortionsController } from "@/domain/shared/PortionsController";
import { FoodContentProduct, ProductContent } from "@/domain/shared/foodContent/foodContent";
import { NutrientSource } from "@/domain/shared/NutrientSource";

import { aggregateNutrients } from "@/lib/nutrients/aggregateNutrients";
import { getSnapshot, Instance, types } from "mobx-state-tree";
const DEFAULT_QUANTITY = 100;

export const DishItem = types.model("DishItem", {
    id: types.identifier,
    sync: types.optional(SyncStatus, {}),
    contentProduct: FoodContentProduct,
})
    .views(self => ({
        get content() {
            return self.contentProduct
        },
        get effectiveQuantity(): number {
            return self.content?.quantity
        },
    })).actions(self => {

        function updateFood(id: string) {
            if (self.contentProduct) {
                self.contentProduct.update(id);
                return;
            }

            self.contentProduct = FoodContentProduct.create({
                variant: 'product',
                foodId: id,
                quantity: self.content?.quantity ?? DEFAULT_QUANTITY
            });
        }

        return { updateFood }
    })

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

        function addChildrenByProductContent(content: Instance<typeof FoodContentProduct> | Instance<typeof FoodContentProduct>[]) {
            if (!Array.isArray(content)) {
                self.addChildWithLocalData({ contentProduct: getSnapshot(content) })
                return
            }
            const payload = content.map(item => ({ contentProduct: getSnapshot(item) }))
            self.addBulkEachWithNewId(payload)
        }

        return {
            addChildrenByProductContent,
            getTotalNutrients,
            changeDescription,
            changeName,
            setLastSync,
        };
    })

export type DishModelInstance = Instance<typeof Dish>
