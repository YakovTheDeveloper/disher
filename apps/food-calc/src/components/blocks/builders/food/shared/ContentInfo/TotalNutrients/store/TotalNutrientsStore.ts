import { types, IAnyStateTreeNode } from "mobx-state-tree";

type FoodId = number
type NutrientId = number

export interface HasTotalNutrients {
    getTotalNutrients(quantity?: number): Record<string, number>;
}

export const TotalNutrientsStore = types
    .model("TotalNutrientsStore", {
        quantity: types.maybe(types.number)
    })
    .volatile<{
        entity: { getTotalNutrients: (q: number) => Record<string, number> } | null
    }>(() => ({
        entity: null
    }))
    .views(self => ({
        get nutrients() {
            console.log('nutrients WTF');
            // console.log('nutrients WTF', content, entityQuantity, e.getTotalNutrients(self.quantity));
            return {}
        }
    }))
    .actions(self => {
        function setEntity(entity: HasTotalNutrients & IAnyStateTreeNode) {
            self.entity = entity;
        }

        function getValue(id: FoodId) { return self.nutrients[id] ?? 0; }

        function getPercent(id: NutrientId) {
            return 0
            // const dailyNormNutrientQuantity = this.dailyNormStoreUI.currentNormNutrients[id]
            // console.log(dailyNormNutrientQuantity);
            // const noNorm = dailyNormNutrientQuantity == null
            // if (noNorm) return null
            // const value = this.getValue(id);
            // return Math.min(10000, (value / dailyNormNutrientQuantity) * 100);
        };

        return {
            getValue,
            getPercent,
            setEntity
        }
    });
