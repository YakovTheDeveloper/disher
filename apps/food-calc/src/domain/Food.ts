import { Nutrient } from "@/domain/Nutrient";
import { isEmpty } from "@/lib/empty";
import { NutrientStoreApi } from "@/store/types";
import { cast, getRoot, types } from "mobx-state-tree";

export const FoodNutrient = types.model("FoodNutrient", {
    quantity: types.number,
    nutrientId: types.identifier,
    nutrient: types.reference(Nutrient, {
        get(identifier, parent) {
            const root = getRoot(parent) as {
                nutrientStore: NutrientStoreApi
            }; // <-- MST helper to get the tree root
            return root.nutrientStore.items.get(identifier);
        },
        set(value) {
            return value.id; // MST needs to know how to store reference
        }
    })
});

// Food
export const Food = types.model("Food", {
    id: types.identifier,
    name: types.string,
    nameEng: types.maybe(types.string),
    description: types.maybe(types.string),
    descriptionEng: types.maybe(types.string),
    nutrients: types.optional(types.array(FoodNutrient), []),
}).views(self => {
    const views = {
        get noNutrients() {
            return isEmpty(self.nutrients);
        },
        get foodWithNoNutrients() {
            return views.noNutrients ? [self] : [];
        }
    }
    return views;
}).actions(self => {

    function getTotalNutrients(productQuantity = 100) {
        const acc: Record<string, number> = {};
        const foodNutrients = self.nutrients || [];
        foodNutrients.forEach(({ nutrientId, quantity: q }) => {
            acc[nutrientId] = (acc[nutrientId] || 0) + (q * productQuantity) / 100;
        });
        return acc;
    }
    function setNutrients(nutrients: {
        quantity: number;
        nutrientId: number;
    }[]) {
        console.log('hellohello', nutrients);
        if (!self.nutrients) {
            self.nutrients = cast([]);
        }
        try {
            const newNutrients = nutrients.map(({ nutrientId, quantity }) =>
                FoodNutrient.create({
                    nutrient: nutrientId.toString(),
                    nutrientId: nutrientId.toString(),
                    quantity
                })
            )
            console.log('newNutrients', newNutrients);
            self.nutrients.replace(newNutrients)
        } catch (error) {

        }
    }
    return {
        setNutrients,
        getTotalNutrients
    }
});
