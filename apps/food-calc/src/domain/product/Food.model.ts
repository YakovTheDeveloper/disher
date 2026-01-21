import { Nutrient } from "@/domain/nutrient/Nutrient";
import { Portion } from "./ProductPortions/ProductPortions";
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
    createdByUser: types.optional(types.boolean, false),
    portions: types.optional(types.array(Portion), []),
    category: types.optional(types.string, ""),

}).views(self => {
    const views = {
        get noNutrients() {
            return isEmpty(self.nutrients);
        },
        get foodWithNoNutrients() {
            return views.noNutrients ? [self] : [];
        },
        get nutrientsMap() {
            const map = new Map<string, typeof self.nutrients[0]>();
            self.nutrients.forEach(nutrient => {
                map.set(nutrient.nutrientId, nutrient);
            });
            return map;
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
        nutrientId: number | string;
    }[]) {
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
            self.nutrients.replace(newNutrients)
        } catch (error) {

        }
    }

    function _addNutrient(nutrientId: string, quantity: number) {
        const existingNutrient = self.nutrients.find(n => n.nutrientId === nutrientId);
        if (!existingNutrient) {
            const newNutrient = FoodNutrient.create({
                nutrientId,
                quantity,
                nutrient: nutrientId
            });
            self.nutrients.push(newNutrient);
            return newNutrient
        }
    }

    function changeName(name: string) {
        self.name = name
    }

    function changeDescription(description?: string) {
        self.description = description
    }

    function changeNutrientValue(nutrientId: string, quantity: number) {
        if (self.createdByUser) {
            console.warn("Cannot change nutrient value for food created by user");
            return;
        }
        const nutrient = self.nutrients.find(n => n.nutrientId === nutrientId)
        console.log(nutrient);
        if (nutrient) {
            nutrient.quantity = quantity
        } else {
            const newNutrient = _addNutrient(nutrientId, quantity)
            if (!newNutrient) return
            newNutrient.quantity = quantity
        }
    }

    return {
        setNutrients,
        getTotalNutrients,
        changeName,
        changeDescription,
        changeNutrientValue
    }
});
