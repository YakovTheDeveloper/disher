
import { DailyNorm } from "@/domain/DailyNorm";
import { Dish } from "@/domain/dish/Dish.model";
import { types } from "mobx-state-tree";

export const User = types.model("User", {
    id: types.identifierNumber,
    name: types.maybeNull(types.string),
    email: types.maybeNull(types.string),
    image: types.maybeNull(types.string),
    createdAt: types.string,
    updatedAt: types.string,
    Schedule: types.array(types.late(() => Schedule)),
    Dish: types.array(types.late(() => Dish)),
    DailyNorm: types.array(types.late(() => DailyNorm))
});
