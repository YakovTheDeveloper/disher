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
});
