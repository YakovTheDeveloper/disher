import { types, Instance, onPatch, getRoot } from "mobx-state-tree";
import { SyncStatus } from "@/domain/commonListItem";
import { sumRecordArray } from "@/lib/sumRecords/sumRecords";
import { emitter } from "@/infrastructure/emitter/emitter";
import { ChildrenController } from "@/domain/shared/ChildrenController";
import { groupItemsByTime } from "@/domain/schedule/schedule.service";
import { ScheduleTime } from "@/store/common/ScheduleTime.model";
import { DishModelInstance } from "@/domain/dish/Dish.model";
import { FoodStoreInstance } from "@/store/FoodStore/FoodStore";
import { DishStore } from "@/store/DishStore/DishStore";
import { FoodContentDish, FoodContentProduct, FoodContentProductInstance } from "@/domain/shared/foodContent/foodContent";
import { FoodInput } from "@/components/features/daySchedule/copy-food-to-day-schedule/CopyFoodFromDayScheduleOverlay/CopyFoodToDaySchedule";

const DEFAULT_QUANTITY = 100;

export type ScheduleItemType = Instance<typeof ScheduleFoodsItem>["type"];

export const ScheduleFoodsItem = types
    .model("ScheduleFood", {
        id: types.identifier,
        time: types.string,
        contentProduct: types.maybeNull(FoodContentProduct),
        contentDish: types.maybeNull(FoodContentDish),
    })
    .views(self => ({
        get content() {
            return self.contentDish || self.contentProduct || null
        }
    }))
    .actions(self => {
        function updateFood(id: string) {
            if (self.contentProduct) {
                self.contentProduct.update(id);
                return;
            }
            self.contentDish = null;
            self.contentProduct = FoodContentProduct.create({
                variant: 'product',
                foodId: id,
                quantity: self.content?.quantity ?? DEFAULT_QUANTITY
            });
        }

        function updateDish(id: string) {
            if (self.contentDish) {
                self.contentDish.update(id);
                return;
            }
            self.contentProduct = null;
            self.contentDish = FoodContentDish.create({
                variant: 'dish',
                dishId: id,
                quantity: self.content?.quantity ?? DEFAULT_QUANTITY
            });
        }

        function clear() {
            self.contentProduct = null;
            self.contentDish = null;
        }

        function update(variant: 'product' | 'dish', id: string) {
            if (variant === 'product') {
                updateFood(id);
            } else {
                updateDish(id);
            }
        }

        function updateTime(time: string) {
            self.time = time
        }

        function getTotalNutrients() {
            return self.content?.getTotalNutrients()
        }

        return {
            updateFood,
            updateDish,
            update,
            clear,
            updateTime,
            getTotalNutrients,
        }
    })

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

        function getChildrenListWithProductContentByIds(ids: string[]): { id: string, contentProduct: FoodContentProductInstance }[] {
            return self.foods.getChildrenByIds(ids)
                .filter(item => item.contentProduct != null)
                .map(item => ({
                    id: item.id,
                    contentProduct: item.contentProduct!
                }))
        }

        function getChildrenWithAnyExistingContentByIds(ids: string[]): ScheduleFoodsItemType[] {
            return self.foods.getChildrenByIds(ids)
                .filter(item => item.contentProduct != null)

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
            getChildrenWithAnyExistingContentByIds,
            getChildrenListWithProductContentByIds,
            getTotalNutrients,
            swapProductsToDish,
            addScheduleItemOfDishType,
            afterCreate,
            beforeDestroy
        };
    })

export type ScheduleFoodsType = Instance<typeof ScheduleFoods>
