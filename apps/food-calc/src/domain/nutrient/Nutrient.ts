import { types } from "mobx-state-tree";

export const Nutrient = types.model("Nutrient", {
    id: types.identifier,
    name: types.maybeNull(types.string),
    nameEng: types.maybeNull(types.string),
    unit: types.maybeNull(types.string),
    unitEng: types.maybeNull(types.string),
    displayName: types.maybeNull(types.string),
    displayNameEng: types.maybeNull(types.string)
});
