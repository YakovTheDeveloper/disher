import { Food } from "@/domain/food";
import { types } from "mobx-state-tree";

export const DishItem = types.model("DishItem", {
    id: types.identifierNumber,
    quantity: types.number,
    foodId: types.number,
    dishId: types.number,
    food: types.late(() => Food)
});

// Dish
export const Dish = types.model("Dish", {
    id: types.identifierNumber,
    name: types.string,
    userId: types.number,
    items: types.array(types.late(() => DishItem))
});
