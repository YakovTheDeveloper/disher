import { Nutrient } from "@/domain/Nutrient";
import { types } from "mobx-state-tree";

// Food
export const Food = types.model("Food", {
    id: types.identifierNumber,
    name: types.string,
    nameEng: types.maybe(types.string),
    description: types.maybeNull(types.string),
    descriptionEng: types.maybeNull(types.string),
    nutrients: types.array(types.late(() => FoodNutrient))
});

export const FoodNutrient = types.model("FoodNutrient", {
    id: types.identifierNumber,
    quantity: types.number,
    foodId: types.number,
    nutrientId: types.number,
    Nutrient: types.late(() => Nutrient)
});
