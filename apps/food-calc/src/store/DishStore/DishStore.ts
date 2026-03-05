import { types, Instance, getRoot, getSnapshot } from "mobx-state-tree"
import { RequestState } from "@/store/shared/RequestState"
import { Dish, DishItem } from "@/domain/dish/Dish.model"
import { RootInstance } from "@/store/store"
import { getDishById, syncDishes } from "@/api/dish/dish.api"
import { createRequestController } from "@/store/common/pureFabrication/createRequestController"
import { StatusModel } from "@/store/common/pureFabrication/StatusModel"
import { createDataStoreModel, createEntityDataStore, createImmutableEntityStore } from "@/store/shared/DataStore"
import { FoodContentProduct } from "@/domain/shared/foodContent/foodContent"
import { DishFactory } from "@/store/DishStore/Dish.factory"

export const DishStore = types.compose(
    types.model({
        itemDraft: types.optional(DishItem, {
            id: "DRAFT",
            contentProduct: {
                foodId: '0',
                quantity: 100,
                variant: "product"
            }
        }),
    }),
    createDataStoreModel("DishStoreData", Dish)
).actions(self => ({

    clearItemDraft() {
        self.itemDraft.updateFood('0')
    },

    commitItemDraft(dishId: string): void {
        const dish = self.user.getById(dishId)
        if (!dish) {
            console.log('no such dish')
            return
        }
        // const content = self.itemDraft.contentProduct
        const { id, ...snapshot } = getSnapshot(self.itemDraft)
        dish.addChildWithLocalData(snapshot)
        self.clearItemDraft()
    },

    createDishWithProductsContent(name: string, content: Instance<typeof FoodContentProduct> | Instance<typeof FoodContentProduct>[]) {
        const dish = self.user.insert(DishFactory.createNewLocal({
            name,
            description: '',
            userId: 0,
        }))

        dish.addChildrenByProductContent(content)
        return dish.id
    }
}))

export type DishStoreInstance = Instance<typeof DishStore>
