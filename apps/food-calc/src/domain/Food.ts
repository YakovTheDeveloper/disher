import { Nutrient } from "@/domain/Nutrient";
import { types } from "mobx-state-tree";

export const FoodNutrient = types.model("FoodNutrient", {
    id: types.identifier,
    quantity: types.number,
    foodId: types.string,
    nutrientId: types.number,
    Nutrient: types.late(() => Nutrient)
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
