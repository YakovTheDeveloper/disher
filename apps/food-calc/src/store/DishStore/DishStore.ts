import { types, Instance, getSnapshot } from "mobx-state-tree"
import { Dish, DishItem } from "@/domain/dish/Dish.model"
import { DataStoreController } from "@/store/shared/DataStore"
import { FoodContentProductInstance } from "@/domain/shared/foodContent/foodContent"
import { DishFactory } from "@/store/DishStore/Dish.factory"

const EMPTY_DRAFT = {
    id: 'DRAFT',
    contentProduct: { foodId: '0', quantity: 100, variant: 'product' as const },
}

export const DishStore = types.compose(
    types.model({ draft: types.optional(DishItem, EMPTY_DRAFT) }),
    DataStoreController(Dish)
)
.actions(self => ({

    getDraft(): Instance<typeof DishItem> {
        return self.draft
    },

    commitDraft(dishId: string) {
        const dish = self.getEntity(dishId)
        if (!dish) return
        const { id: _draftId, ...snapshot } = getSnapshot(self.draft)
        dish.addChildWithLocalData(snapshot)
        self.draft = DishItem.create(EMPTY_DRAFT)
    },

    setDraftFood(foodId: string) {
        self.draft.updateFood(foodId)
    },

    resetDraft() {
        self.draft = DishItem.create(EMPTY_DRAFT)
    },

    createDishWithProductsContent(name: string, content: FoodContentProductInstance[]) {
        const dish = self.insert(DishFactory.createNewLocal({
            name,
            description: '',
            userId: 0,
        }))

        dish.addChildrenByProductContent(content)
        return dish.id
    }
}))

export type DishStoreInstance = Instance<typeof DishStore>
