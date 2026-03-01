import { FoodStoreInstance } from "@/store/FoodStore/FoodStore"
import { getEnv, getRoot, Instance, types } from "mobx-state-tree"

export interface RootStoreEnv {
    dishStore: import("@/store/DishStore/DishStore").DishStore;
    foodStore: FoodStoreInstance;
}

const DEFAULT_QUANTITY = 100;

export type FoodContentType = 'dish' | 'product'

// Re-export new controllers for backward compatibility

export const FoodContentProduct = types
    .model("FoodContentProduct", {
        foodId: types.string,
        variant: types.literal("product"),
        quantity: 100,
    })
    .views(self => ({
        get food() {
            const root = getRoot(self) as RootStoreEnv
            return root.foodStore.getEntity(self.foodId) ?? null
        },
        get dish() {
            return null
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
        updateQuantity(quantity: number) {
            self.quantity = quantity;
        },
        getTotalNutrients() {
            return self.food?.getTotalNutrients(self.quantity)
        }
    }))

export type FoodContentProductInstance = Instance<typeof FoodContentProduct>

export const FoodContentDish = types
    .model("FoodContentDish", {
        dishId: types.string,
        variant: types.literal("dish"),
        quantity: 100,
    })
    .views(self => ({
        get dish() {
            const root = getRoot(self) as RootStoreEnv
            return root.dishStore.getEntity(self.dishId)
        },
        get food() {
            return null
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
        updateQuantity(quantity: number) {
            self.quantity = quantity;
        },
        getTotalNutrients() {
            return self.dish?.getTotalNutrients(self.quantity)
        }
    }))

export type FoodContentDishInstance = Instance<typeof FoodContentDish>

export type FoodContentInstance = FoodContentProductInstance | FoodContentDishInstance

export const ContentControllerFood = types.model({
    contentProduct: types.maybeNull(FoodContentProduct),
    contentDish: types.maybeNull(FoodContentDish)
}).views(self => ({
    get content() {
        return self.contentDish || self.contentProduct || null
    }
})).actions(self => {

    function updateFood(id: string) {
        // food → food
        if (self.contentProduct) {
            self.contentProduct.update(id);
            return;
        }

        // dish → food / empty → food
        self.contentDish = null;
        self.contentProduct = FoodContentProduct.create({
            variant: 'product',
            foodId: id,
            quantity: self.content?.quantity ?? DEFAULT_QUANTITY
        });
    }

    function updateDish(id: string) {
        // dish → dish
        if (self.contentDish) {
            self.contentDish.update(id);
            return;
        }

        // food → dish / empty → dish
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

    return {
        updateFood,
        updateDish,
        update,
        clear
    }
})

export const ContentControllerDish = types.model({
    contentProduct: FoodContentProduct,
}).views(self => ({
    get content() {
        return self.contentProduct
    }
})).actions(self => {

    function updateFood(id: string) {
        // food → food

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

    return {
        updateFood,
    }
})