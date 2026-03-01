import { nutrientGroups } from "@/components/features/builders/TotalNutrients/Nutrients/constants";
import { Nutrient } from "@/domain/nutrient/Nutrient";
import { getRoot, types } from "mobx-state-tree";

export const NutrientStore = types.model("NutrientStore", {
    items: types.map(Nutrient),
}).actions((self => ({

    applySeed() {
        const data = nutrientGroups.flatMap(group => group.content).reduce((acc, nutrient) => {
            const id = nutrient.id.toString();

            acc[id] = Nutrient.create({
                id,
                name: nutrient.name,
                displayName: nutrient.displayName,
                unit: nutrient.unit,
            });

            return acc;
        }, {})

        self.items.replace(new Map(Object.entries(data)))
    }
})));

// Flatten all nutrient items from all groups
// const allNutrients = nutrientGroups.flatMap(group => group.content);

// export const createNutrientStoreWithInitialData = () =>
//     NutrientStore.create({
//         items: allNutrients.reduce((acc, nutrient) => {
//             const id = nutrient.id.toString();

//             acc[id] = Nutrient.create({
//                 id,
//                 name: nutrient.name,
//                 displayName: nutrient.displayName,
//                 unit: nutrient.unit,
//             });

//             return acc;
//         }, {}),
//     });
