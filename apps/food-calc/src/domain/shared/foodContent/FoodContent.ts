
import { RootStoreEnv } from "@/domain/schedule/schedule"
import { FoodStoreInstance } from "@/store/FoodStore/FoodStore"
import { getEnv, getRoot, getParent, types } from "mobx-state-tree"

export type FoodContentType = 'dish' | 'product'

export const FoodContentProduct = types
    .model("FoodContentProduct", {
        foodId: types.string,
        variant: types.literal("product"),
    })
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

        get parentQuantity(): number {
            return getParent(self).quantity
        },
    }))

    .actions(self => ({
        getTotalNutrients() {
            return self.food?.getTotalNutrients(self.parentQuantity) ?? {}
        },
        update(id: string) {
            self.foodId = id
        },
    }))

export const FoodContentDish = types
    .model("FoodContentDish", {
        dishId: types.string,
        variant: types.literal("dish"),
    })
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
        get parentQuantity(): number {
            return getParent(self).quantity
        },
    }))
    .actions(self => ({
        getTotalNutrients() {
            return (
                self.dish?.getTotalNutrients(self.parentQuantity) ?? {}

            )
        },
        update(id: string) {
            self.dishId = id
        }
    }))
