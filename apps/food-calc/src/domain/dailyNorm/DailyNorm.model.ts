import { types, getRoot, Instance } from "mobx-state-tree";
import { Nutrient } from "@/domain/nutrient/Nutrient";
import { generateId } from "@/lib/id/generateId";
import type { RootInstance } from "@/store/RootStoreModel";

export const DailyNormItem = types.model("DailyNormItem", {
    id: types.identifier,
    nutrientId: types.string,
    quantity: types.maybeNull(types.number)
}).views(self => ({
    get nutrient(): Instance<typeof Nutrient> | undefined {
        const root = getRoot(self) as RootInstance;
        return root.nutrientStore.items.get(self.nutrientId);
    }
}));

export const DailyNorm = types.model("DailyNorm", {
    id: types.identifier,
    name: types.string,
    description: types.string,
    items: types.array(DailyNormItem),
    createByUser: types.boolean
})
    .views(self => ({
        get nutrientIdToDailyNormItem(): Map<string, Instance<typeof DailyNormItem>> {
            const map = new Map<string, Instance<typeof DailyNormItem>>();
            for (const item of self.items) {
                map.set(item.nutrientId, item);
            }
            return map;
        }
    }))
    .actions(self => ({
        changeName(name: string) {
            if (!self.createByUser) {
                throw new Error("Cannot change name for predefined daily norm");
            }
            self.name = name;
        },
        changeDescription(description: string) {
            if (!self.createByUser) {
                throw new Error("Cannot change description for predefined daily norm");
            }
            self.description = description;
        },
        changeNutrientValue(nutrientId: string, quantity: number | null) {
            if (!self.createByUser) {
                throw new Error("Cannot change nutrient values for predefined daily norm");
            }
            const item = self.items.find(normItem => normItem.nutrientId === nutrientId);
            if (item) {
                item.quantity = quantity;
            }
        }
    }));
