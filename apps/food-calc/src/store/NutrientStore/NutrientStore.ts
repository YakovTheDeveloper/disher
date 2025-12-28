import { nutrientGroups } from "@/components/features/builders/food/shared/ContentInfo/Nutrients/constants";
import { Nutrient } from "@/domain/Nutrient";
import { getRoot, types } from "mobx-state-tree";

export const NutrientStore = types.model("NutrientStore", {
    items: types.map(Nutrient),
});

// Flatten all nutrient items from all groups
const allNutrients = nutrientGroups.flatMap(group => group.content);

export const createNutrientStoreWithInitialData = () =>
    NutrientStore.create({
        items: allNutrients.reduce((acc, nutrient) => {
            const id = nutrient.id.toString();

            acc[id] = Nutrient.create({
                id,
                name: nutrient.name,
                displayName: nutrient.displayName,
                unit: nutrient.unit,
            });

            return acc;
        }, {}),
    });
