import { getTotalDishFoodContentQuantity } from "@/store/models/dish/dish.domain";
import { getTotalFoodAndDishFoodQuantityFromSchedule } from "@/store/models/schedule/schedule.domain";
import { describe, it, expect } from "vitest";

describe("getTotalFoodAndDishFoodQuantityFromSchedule", () => {
    it("returns single food item as-is", () => {
        const result = getTotalFoodAndDishFoodQuantityFromSchedule({
            food: { id: 1, name: "some pasta" },
            quantity: 150,
        });

        expect(result).toEqual([{ id: 1, quantity: 150 }]);
    });

    it("returns scaled ingredients for dish", () => {
        const item = {
            quantity: 130, // user ate 130g of dish
            dish: {
                id: 1,
                name: "",
                items: [
                    { food: { id: 1, name: "" }, quantity: 110 },
                    { food: { id: 2, name: "" }, quantity: 100 },
                    { food: { id: 3, name: "" }, quantity: 50 },
                ],
            },
        };

        const result = getTotalFoodAndDishFoodQuantityFromSchedule(item);

        // total dish weight = 260
        // scale factor = 130 / 260 = 0.5
        expect(result).toEqual([
            { id: 1, quantity: 55 },
            { id: 2, quantity: 50 },
            { id: 3, quantity: 25 },
        ]);
    });

    it("returns empty array for invalid input", () => {
        const result = getTotalFoodAndDishFoodQuantityFromSchedule({} as any);
        expect(result).toEqual([]);
    });

    it("handles dish with one ingredient", () => {
        const item = {
            quantity: 200,
            dish: {
                id: 1,
                name: "",
                items: [{ food: { id: 1, name: "" }, quantity: 100 }],
            },
        };
        const result = getTotalFoodAndDishFoodQuantityFromSchedule(item);
        // scale factor = 200 / 100 = 2
        expect(result).toEqual([{ id: 1, quantity: 200 }]);
    });

    // 🧪 New Tests

    it("scales single food correctly when quantity is halved", () => {
        const result = getTotalFoodAndDishFoodQuantityFromSchedule({
            food: { id: 10, name: "chicken" },
            quantity: 50,
        });
        expect(result).toEqual([{ id: 10, quantity: 50 }]);
    });

    it("scales single food correctly when quantity is doubled", () => {
        const result = getTotalFoodAndDishFoodQuantityFromSchedule({
            food: { id: 10, name: "chicken" },
            quantity: 200,
        });
        expect(result).toEqual([{ id: 10, quantity: 200 }]);
    });

    it("handles dish with scale factor > 1 (user eats more than base)", () => {
        const item = {
            quantity: 520, // user ate double the dish
            dish: {
                id: 2,
                name: "",
                items: [
                    { food: { id: 1, name: "" }, quantity: 110 },
                    { food: { id: 2, name: "" }, quantity: 100 },
                    { food: { id: 3, name: "" }, quantity: 50 },
                ],
            },
        };
        const result = getTotalFoodAndDishFoodQuantityFromSchedule(item);
        // scale = 520 / 260 = 2
        expect(result).toEqual([
            { id: 1, quantity: 220 },
            { id: 2, quantity: 200 },
            { id: 3, quantity: 100 },
        ]);
    });

    it("handles dish with zero quantity gracefully", () => {
        const item = {
            quantity: 0,
            dish: {
                id: 3,
                name: "",
                items: [
                    { food: { id: 1, name: "" }, quantity: 110 },
                    { food: { id: 2, name: "" }, quantity: 100 },
                ],
            },
        };
        const result = getTotalFoodAndDishFoodQuantityFromSchedule(item);
        expect(result).toEqual([
            { id: 1, quantity: 0 },
            { id: 2, quantity: 0 },
        ]);
    });

    it("handles food and dish separately (two calls)", () => {
        const dishResult = getTotalFoodAndDishFoodQuantityFromSchedule({
            quantity: 130,
            dish: {
                id: 4,
                name: "mixed plate",
                items: [
                    { food: { id: 1, name: "potato" }, quantity: 110 },
                    { food: { id: 2, name: "meat" }, quantity: 100 },
                ],
            },
        });

        const foodResult = getTotalFoodAndDishFoodQuantityFromSchedule({
            food: { id: 3, name: "salad" },
            quantity: 50,
        });

        expect(dishResult).toEqual([
            { id: 1, quantity: 68.0952380952381 },
            { id: 2, quantity: 61.904761904761905 },
        ]);

        expect(foodResult).toEqual([{ id: 3, quantity: 50 }]);

        // Optional: sanity check — sum of scaled ingredients = dish quantity
        const totalScaled = getTotalDishFoodContentQuantity(dishResult)
        expect(Math.round(totalScaled)).toBe(130);
    });
});
