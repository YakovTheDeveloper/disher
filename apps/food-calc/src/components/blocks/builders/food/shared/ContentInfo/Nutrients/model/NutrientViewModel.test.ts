
import { NutrientViewModelStore } from "@/components/blocks/builders/food/shared/ContentInfo/Nutrients/model/NutrientsViewModel";
import { FoodModelStore } from "@/store/models/food/foodModelStore";
import { describe, it, expect } from "vitest";

describe("NutrientViewModelStore", () => {
    const mockFoodModel = new FoodModelStore()
    mockFoodModel.set(1, { id: 1, name: '1', nutrients: [{ nutrientId: 10, quantity: 50 }] })
    mockFoodModel.set(2, { id: 2, name: '1', nutrients: [{ nutrientId: 10, quantity: 20 }, { nutrientId: 11, quantity: 5 }] })

    it("calculates sums correctly", () => {
        const store = new NutrientViewModelStore(mockFoodModel);

        store.setCurrentFood([
            { id: 1, quantity: 200 }, // 2 × 50 = 100
            { id: 2, quantity: 150 }, // 1.5 × 20 = 30 and 1.5 × 5 = 7.5
        ]);

        expect(store.sums[10]).toBeCloseTo(130); // 100 + 30
        expect(store.sums[11]).toBeCloseTo(7.5);
    });

    it("getValue returns nutrient sum", () => {
        const store = new NutrientViewModelStore(mockFoodModel);
        store.setCurrentFood([{ id: 1, quantity: 100 }]);
        expect(store.getValue(10)).toBe(50);
        expect(store.getValue(11)).toBe(0);
    });

    it("getPercent respects daily norms", () => {
        const store = new NutrientViewModelStore(mockFoodModel);
        store.setCurrentFood([{ id: 1, quantity: 100 }]);

        // If defaultDailyNorms[10] is, say, 100
        // then 50/100 * 100 = 50%
        expect(store.getPercent(10)).toBe(50);
    });
});
