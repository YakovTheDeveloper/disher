
import { RootStoreEnv } from "@/domain/schedule/schedule.model"
import { FoodStoreInstance } from "@/store/FoodStore/FoodStore"
import { getEnv, getRoot, types } from "mobx-state-tree"
import { NutrientContentMixin } from "@/domain/shared/NutrientContentMixin"

export type FoodContentType = 'dish' | 'product'

export const FoodContentProduct = types
    .compose(
        "FoodContentProduct",
        types.model({
            foodId: types.string,
            variant: types.literal("product"),
        }),
        NutrientContentMixin('food')
    )
    .views(self => ({
        get food() {
            const foodStore = getEnv(self)?.foodStore as FoodStoreInstance
            return foodStore?.getEntity(self.foodId) ?? null
        },
    }))
    .views(self => ({
        get isCustom() {
            return self.food?.createdByUser || 'no data'
        },
        get name() {
            return self.food?.name ?? "нет имени"
        },

        get foodWithNoNutrients() {
            return self.food?.noNutrients ? [self.food] : []
        },
    }))
    .actions(self => ({
        update(id: string) {
            self.foodId = id
        },
        getTotalNutrients() {
            return self.food?.getTotalNutrients(self.parentQuantity)
        }
    }))

export const FoodContentDish = types
    .compose(
        "FoodContentDish",
        types.model({
            dishId: types.string,
            variant: types.literal("dish"),
        }),
        NutrientContentMixin('dish')
    )
    .views(self => ({
        get dish() {
            const root = getRoot(self) as RootStoreEnv
            return root.dishStore.getEntity(self.dishId)
        },
    }))
    .views(self => ({
        get name() {
            return self.dish?.name ?? 'Без имени'
        },

        get foodWithNoNutrients() {
            return self.dish?.foodWithNoNutrients
        },
    }))
    .actions(self => ({
        update(id: string) {
            self.dishId = id
        },
        getTotalNutrients() {
            return self.dish?.getTotalNutrients(self.parentQuantity)
        }
    }))
