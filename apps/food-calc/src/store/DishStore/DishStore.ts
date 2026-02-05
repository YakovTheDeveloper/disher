import { types, Instance, getRoot, getSnapshot } from "mobx-state-tree"
import { RequestState } from "@/store/shared/RequestState"
import { Dish, DishItem } from "@/domain/dish/Dish.model"
import { RootInstance } from "@/store/store"
import { getDishById, syncDishes } from "@/api/dish/dish.api"
import { createRequestController } from "@/store/common/pureFabrication/createRequestController"
import { StatusModel } from "@/store/common/pureFabrication/StatusModel"
import { createDataStoreModel, createEntityDataStore, createImmutableEntityStore } from "@/store/shared/DataStore"

const storeModel = types.model("DishStore", {
    request: types.map(RequestState),
    status: types.optional(StatusModel, {
        fetchGet: {},
        fetchSync: {},
    }),
    // Draft state for dish items
    itemDraft: types.optional(DishItem, {
        id: "DRAFT",
        contentProduct: {
            foodId: '0',
            quantity: 100,
            variant: "product"
        }
    }),
})
    .actions(self => ({

        fetchSync: async (payload: Instance<typeof Dish>[]) => {
            const syncRequest = createRequestController({
                getState: (id: string, variant: string) => self.status[variant].get(id)
            })

            return await syncRequest.run(
                payload.map(x => ({ id: x.id, variant: "fetchSync" })),
                () => syncDishes(payload)
            );
        },

        fetchGet: async (id: string) => {
            const syncRequest = createRequestController({
                getState: (id: string, variant: string) => self.status[variant].get(id)
            });
            return await syncRequest.load(
                [{ id, variant: "fetchGet" }],
                () => getDishById(id)
            );
        },

        // ======== DRAFT METHODS ========
        clearItemDraft() {
            self.itemDraft.updateFood('0')
        },

        commitItemDraft(dish: Instance<typeof Dish>): void {
            // const content = self.itemDraft.contentProduct
            const { id, ...snapshot } = getSnapshot(self.itemDraft)
            dish.addChildWithLocalData(snapshot)
            self.clearItemDraft()
        },
    }))

export const DishStore = types.compose(
    "DishStore",
    storeModel,
    createDataStoreModel("DishStoreData", Dish)
)

export type DishStoreInstance = Instance<typeof DishStore>
