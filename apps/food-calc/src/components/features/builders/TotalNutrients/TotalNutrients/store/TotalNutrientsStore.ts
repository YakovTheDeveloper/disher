// TODO: full rewrite needed — this store was heavily MST-dependent
// It relied on domainStore.foodStore for loading nutrients and checking loading state.
// The MST model pattern (types.model + onPatch) needs to be replaced with
// either a Zustand store or React hooks that use Triplit queries.

import { types, flow, onPatch } from "mobx-state-tree";

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
        getPercent(_id: NutrientId) {
            return 0
        },
        get isOneOfProductsIsLoading() {
            // TODO: replace with Triplit query loading state
            return false
        }
    }))
    .actions(self => {
        let disposeEntityListener: null | (() => void) = null

        const actions = {
            beforeDestroy() {
                disposeEntityListener?.()
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
                    if (
                        patch.path.match(/nutrients\/\d+\/quantity/) ||
                        patch.path.match(/items\/\d+\/quantity/) ||
                        patch.path.match(/items\/\d+\/content/) ||
                        patch.path === "/items" ||
                        patch.path.match(/items\/\d+$/)
                    ) {
                        actions.loadNutrientsAndCalculate()
                    }
                })
            },

            loadNutrientsAndCalculate: flow(function* () {
                if (!self.entity) return
                // TODO: replace with Triplit query for missing nutrients
                actions.calculateNutrients()
            })
        }

        return actions
    })
