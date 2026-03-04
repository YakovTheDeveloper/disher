import { FoodModelStore } from "@/store/FoodStore/FoodStore";
import { domainStore } from "@/store/store";
import { reaction, runInAction, toJS } from "mobx";
import { types, IAnyStateTreeNode, Instance, flow, onPatch } from "mobx-state-tree";

type FoodId = string
type NutrientId = number

export interface NutrientsCountableEntity {
    getTotalNutrients: (q?: number) => Record<string, number>,
    foodWithNoNutrients: { id: string }[]
}

export const TotalNutrientsStore = types
    .model("TotalNutrientsStore", {
        nutrients: types.map(types.number),
    })
    .volatile<{
        entity: NutrientsCountableEntity | null
    }>(() => ({
        entity: null,
    }))
    .views(self => ({
        getValue(id: FoodId) {
            return self.nutrients.get(String(id)) ?? 0;
        },
        getPercent(id: NutrientId) {
            return 0
            // const dailyNormNutrientQuantity = this.dailyNormStoreUI.currentNormNutrients[id]
            // console.log(dailyNormNutrientQuantity);
            // const noNorm = dailyNormNutrientQuantity == null
            // if (noNorm) return null
            // const value = this.getValue(id);
            // return Math.min(10000, (value / dailyNormNutrientQuantity) * 100);
        },
        get isOneOfProductsIsLoading() {
            const ids = self.entity?.foodWithNoNutrients.map(({ id }) => id) || []
            return domainStore.foodStore.isOneOfProductsIsLoading(ids)
        }
    }))
    .actions(self => {
        let disposeEntityListener: null | (() => void) = null
        // let disposeQuantityReaction: null | (() => void) = null

        const actions = {

            // afterCreate() {
            //     disposeQuantityReaction = reaction(
            //         () => self.entity?.quantity,
            //         () => {
            //             actions.loadNutrientsAndCalculate()
            //         },
            //         { fireImmediately: true }
            //     )
            // },

            beforeDestroy() {
                disposeEntityListener?.()
                // disposeQuantityReaction?.()
            },

            calculateNutrients() {
                if (!self.entity) return;
                const totals = self.entity.getTotalNutrients()
                actions.setNutrients(totals)
            },

            setNutrients(totals: Record<string, number>) {
                self.nutrients.clear()
                for (const [id, qty] of Object.entries(totals)) {
                    self.nutrients.set(id, qty)
                }
            },

            setEntity(entity: NutrientsCountableEntity) {
                disposeEntityListener?.()
                self.entity = entity
                actions.loadNutrientsAndCalculate()

                disposeEntityListener = onPatch(entity, patch => {
                    console.log('patch');
                    if (
                        patch.path.match(/nutrients\/\d+\/quantity/) ||
                        patch.path.match(/items\/\d+\/quantity/) ||
                        patch.path.match(/items\/\d+\/content/) ||
                        patch.path === "/items" ||
                        patch.path.match(/items\/\d+$/)
                    ) {
                        actions.loadNutrientsAndCalculate()   // ✔ здесь всё хорошо
                    }
                })
            },

            loadNutrientsAndCalculate: flow(function* () {
                if (!self.entity) return
                const missing = self.entity.foodWithNoNutrients.map(f => f.id)
                const result = yield domainStore.foodStore.loadFoodWithNutrientsByFoodIds(missing)
                if (result[0]) return result
                actions.calculateNutrients()
                return result
            })
        }

        return actions
    })
