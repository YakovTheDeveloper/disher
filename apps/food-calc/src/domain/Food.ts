import { Nutrient } from "@/domain/Nutrient";
import { getRoot, types } from "mobx-state-tree";

export const FoodNutrient = types.model("FoodNutrient", {
    quantity: types.number,
    nutrientId: types.identifier,
    nutrient: types.reference(Nutrient, {
        get(identifier, parent) {
            const root = getRoot(parent); // <-- MST helper to get the tree root
            return root.nutrientStore.data.get(identifier);
        },
        set(value) {
            return value.id; // MST needs to know how to store reference
        }
    })
});

// Food
export const Food = types.model("Food", {
    id: types.identifier,
    name: types.string,
    nameEng: types.maybe(types.string),
    description: types.maybe(types.string),
    descriptionEng: types.maybe(types.string),
    nutrients: types.maybe(types.array(FoodNutrient)),
}).views(self => ({

    get noNutrients() {
        return !self.nutrients
    }
})).actions(self => {

    function getTotalNutrients(productQuantity: number) {
        const acc: Record<string, number> = {};
        const foodNutrients = self.nutrients || [];
        foodNutrients.forEach(({ nutrientId, quantity: q }) => {
            acc[nutrientId] = (acc[nutrientId] || 0) + (q * productQuantity) / 100;
        });
        return acc;
    }
    return {
        getTotalNutrients
    }
});
