import { types, getRoot, Instance } from "mobx-state-tree";
import { allNutrientsList } from "@/components/features/builders/food/shared/ContentInfo/Nutrients/constants";
import { Nutrient } from "@/domain/nutrient/Nutrient";
import { generateId } from "@/lib/id/generateId";
import type { RootInstance } from "@/store/types";

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
    items: types.array(DailyNormItem)
});

export const UserDailyNorm = DailyNorm
    .named("UserDailyNorm")
    .props({
        items: types.array(types.late(() => DailyNormItem)),
        // userId: types.number,
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
            self.name = name
        },

        changeDescription(description: string) {
            self.description = description
        },

        changeNutrientValue(nutrientId: string, quantity: number | null) {
            const item = self.items.find(normItem => normItem.nutrientId === nutrientId);

            if (item) {
                item.quantity = quantity;
            }
        },

    }))
