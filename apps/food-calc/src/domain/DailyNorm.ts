import { Nutrient } from "@/domain/Nutrient";
import { types } from "mobx-state-tree";

export const DailyNormItem = types.model("DailyNormItem", {
    id: types.identifierNumber,
    normId: types.number,
    nutrientId: types.number,
    quantity: types.maybeNull(types.number),
    Nutrient: types.late(() => Nutrient)
});

// DailyNorm
export const DailyNorm = types.model("DailyNorm", {
    id: types.identifierNumber,
    userId: types.number,
    name: types.string,
    description: types.string,
    items: types.array(types.late(() => DailyNormItem))
});
