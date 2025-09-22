
import { NutrientViewModelStore } from "@/components/blocks/builders/food/shared/ContentInfo/Nutrients/model/NutrientsViewModel";
import { DailyNormModelStore } from "@/store/models/dailyNorm/dailyNorm.model";
import { FoodModelStore } from "@/store/models/food/foodModelStore";
import { DailyNormsStoreUI } from "@/store/uiStore/dailyNorms/DailyNormsStoreUI";
import { describe, it, expect } from "vitest";

describe("NutrientViewModelStore", () => {
    const mockFoodModel = new FoodModelStore()
    mockFoodModel.set(1, { id: 1, name: 'Some rice', nutrients: [{ nutrientId: 10, quantity: 50 }] })
    mockFoodModel.set(2, { id: 2, name: 'Some pasta', nutrients: [{ nutrientId: 10, quantity: 20 }, { nutrientId: 11, quantity: 5 }] })

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

    describe('getPercent', () => {
        const dailyNormModelStore = new DailyNormModelStore()
        const dailyNormStore = new DailyNormsStoreUI(dailyNormModelStore)
        const store = new NutrientViewModelStore(mockFoodModel, dailyNormStore);
        const product = { id: 1, quantity: 100 }
        store.setCurrentFood([product]);
        const nutrientId = 10

        it("getPercent respects daily norms", () => {
            const percent = store.getPercent(nutrientId)
            expect(percent).toBe(5);
        });

        it("getPercent respects daily norms after daily norm changed", () => {
            dailyNormModelStore.set(mockDailyNorm.id, mockDailyNorm)
            dailyNormStore.setCurrentNorm(mockDailyNorm.id)
            const percent = store.getPercent(nutrientId)
            expect(percent).toBe(10);
        });
    })

});

const MOCK_NORM_ID = -1
const mockDailyNorm = {
    id: MOCK_NORM_ID,
    name: 'mock',
    description: '',
    items: [
        { "nutrientId": 1, "quantity": 51 },
        { "nutrientId": 2, "quantity": 70 },
        { "nutrientId": 3, "quantity": 275 },
        { "nutrientId": 4, "quantity": 50 },
        { "nutrientId": 5, "quantity": 30 },
        { "nutrientId": 6, "quantity": 25 },
        { "nutrientId": 7, "quantity": 2000 },
        { "nutrientId": 8, "quantity": 2000 },
        { "nutrientId": 9, "quantity": 18 },
        { "nutrientId": 10, "quantity": 500 },
        { "nutrientId": 11, "quantity": 350 },
        { "nutrientId": 12, "quantity": 700 },
        { "nutrientId": 13, "quantity": 3500 },
        { "nutrientId": 14, "quantity": 2300 },
        { "nutrientId": 15, "quantity": 15 },
        { "nutrientId": 16, "quantity": 900 },
        { "nutrientId": 17, "quantity": 2300 },
        { "nutrientId": 18, "quantity": 55 },
        { "nutrientId": 19, "quantity": 150 },
        { "nutrientId": 20, "quantity": 900 },
        { "nutrientId": 21, "quantity": 1.2 },
        { "nutrientId": 22, "quantity": 1.3 },
        { "nutrientId": 23, "quantity": 16 },
        { "nutrientId": 24, "quantity": 550 },
        { "nutrientId": 25, "quantity": 5 },
        { "nutrientId": 26, "quantity": 2 },
        { "nutrientId": 28, "quantity": 400 },
        { "nutrientId": 29, "quantity": 2.4 },
        { "nutrientId": 30, "quantity": 90 },
        { "nutrientId": 31, "quantity": 20 },
        { "nutrientId": 32, "quantity": 15 },
        { "nutrientId": 33, "quantity": 120 },
        { "nutrientId": 34, "quantity": 3000 },
        { "nutrientId": 35, "quantity": 600 }
    ]

}
