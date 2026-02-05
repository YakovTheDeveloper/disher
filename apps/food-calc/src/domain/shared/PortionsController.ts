import { Portion } from "@/domain/product/ProductPortions/ProductPortions";
import { types } from "mobx-state-tree";

export function PortionsController() {
    return types.model({
        portions: types.optional(types.array(Portion), [])
    }).views(self => ({
        getPortionByLabel(label: string) {
            return self.portions.find(p => p.label === label);
        }
    })).actions(self => ({
        addPortion(portion: { label: string; amount: number; unit: string; grams: number }) {
            self.portions.push(portion);
        },
        updatePortion(label: string, updates: Partial<{ label: string; amount: number; unit: string; grams: number }>) {
            const portion = self.portions.find(p => p.label === label);
            if (portion) {
                if (updates.label !== undefined) portion.label = updates.label;
                if (updates.amount !== undefined) portion.amount = updates.amount;
                if (updates.unit !== undefined) portion.unit = updates.unit;
                if (updates.grams !== undefined) portion.grams = updates.grams;
            }
        },
        removePortion(label: string) {
            const index = self.portions.findIndex(p => p.label === label);
            if (index !== -1) {
                self.portions.splice(index, 1);
            }
        },
        setPortions(portions: { label: string; amount: number; unit: string; grams: number }[]) {
            self.portions.replace(portions);
        }
    }));
}
