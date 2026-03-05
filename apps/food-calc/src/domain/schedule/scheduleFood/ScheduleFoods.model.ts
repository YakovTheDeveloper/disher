import { types, Instance, onPatch } from "mobx-state-tree";
import { SyncStatus } from "@/domain/commonListItem";
import { sumRecordArray } from "@/lib/sumRecords/sumRecords";
import { emitter } from "@/infrastructure/emitter/emitter";
import { ChildrenController } from "@/domain/shared/ChildrenController";
import { groupItemsByTime } from "@/domain/schedule/schedule.service";
import { ContentControllerFood } from "@/domain/shared/foodContent/foodContent";
import { ScheduleTime } from "@/store/common/ScheduleTime.model";
import { DishModelInstance } from "@/domain/dish/Dish.model";

export type ScheduleItemType = Instance<typeof ScheduleFoodsItem>["type"];

export const ScheduleFoodsItem = types.compose("ScheduleFood", types.model({
    id: types.identifier,
    time: types.string,
}), ContentControllerFood).actions(self => ({
    updateTime(time: string) {
        self.time = time
    },
}))

export type ScheduleFoodsItemType = Instance<typeof ScheduleFoodsItem>

export const ScheduleFoods = types.model({
    id: types.identifier,
    foods: ChildrenController(ScheduleFoodsItem),
})
    .views(self => ({
        getChildById(id: string): Instance<typeof ScheduleFoodsItem> | null {
            return self.foods.items.find(item => item.id.toString() === id) || null;
        },
        get customItems() {
            return self.foods.items.filter(item => item.content?.variant === "product" && item.content?.food?.createdByUser) || null;
        },
        get allDraftDishesFromItems() {
            return self.foods.items
                .filter(item => item.content?.variant === "dish" && item.content?.dish)
                .map(item => item.content.dish!)

        },
        get foodWithNoNutrients() {
            return Array.from(new Set(self.foods.items
                .filter(item => item.content != null)
                .flatMap(item => item.content!.foodWithNoNutrients)))
        },
        get itemsLength() {
            return self.foods.items.length
        },
        get isNoItems() {
            return self.foods.items.length === 0
        },
        get foodsGroupedByTime() {
            return groupItemsByTime(self.foods.items);
        },
    }))
    .actions(self => {

        let disposer: any = null

        function getProductOnlyChildrenByIds(ids: string[]) {
            return self.foods.getChildrenByIds(ids).filter(item => item.content?.variant === "product")
        }

        function swapProductsToDish(productsIds: string[], dishId: string) {
            const products = self.foods.getChildrenByIds(productsIds);
            const timeToUse = products[0]?.time || new Date().toTimeString().slice(0, 5);

            self.foods.addChildWithLocalData({
                time: timeToUse,
                contentDish: {
                    dishId,
                    variant: 'dish' as const,
                }
            });

            self.foods.removeBulk(productsIds);
        }

        function addScheduleItemOfDishType(dishId: string) {
            const currentTime = new Date().toTimeString().slice(0, 5);

            self.foods.addChildWithLocalData({
                time: currentTime,
                contentDish: {
                    dishId,
                    variant: 'dish' as const,
                }
            });
        }

        function afterCreate() {
            disposer = onPatch(self, patch => {
                if (
                    patch.path.match(/items\/\d+\/content\/contentProduct\/\w+\/quantity/) ||
                    patch.path.match(/items\/\d+\/content\/contentDish\/\w+\/quantity/) ||
                    patch.path.match(/items\/\d+\/content\/contentProduct/) ||
                    patch.path.match(/items\/\d+\/content\/contentDish/) ||
                    patch.path.match(/items\/\d+\/content/) ||
                    patch.path === "/items" ||
                    patch.path.match(/items\/\d+$/)
                ) {
                    emitter.emit('CALCULATION_NEEDED')
                }
            })
        }

        function beforeDestroy() {
            disposer?.()
        }

        function getTotalNutrients() {
            const nutrients = self.foods.items.map(item => {
                if (item.content == null) return {}
                return item.content.getTotalNutrients() || {}
            });
            return sumRecordArray(nutrients);
        }

        return {
            getProductOnlyChildrenByIds,
            getTotalNutrients,
            swapProductsToDish,
            addScheduleItemOfDishType,
            afterCreate,
            beforeDestroy
        };
    })
