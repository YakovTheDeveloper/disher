import { types } from "mobx-state-tree";

export const Portion = types.model("Portion", {
    label: types.string,
    amount: types.number,
    unit: types.string,
    grams: types.number
});
