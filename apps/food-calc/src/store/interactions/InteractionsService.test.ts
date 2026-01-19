import { domainStore } from "@/store/store";
import { describe, it, expect } from "vitest";

describe("save dish draft flow", () => {
    it("should create, save and clean up temp dish correctly", () => {
        const root = domainStore;

        //
        // --- Food setup ---
        //
        const food1 = root.foodStore.addLocal({ id: "1", name: "Chicken" });
        const food2 = root.foodStore.addLocal({ id: "2", name: "Chicken" });

        //
        // --- Schedule and items ---
        //
        const schedule = root.daySchedule.addLocal({
            date: "01-01-2021",
            isDraft: true,
        });

        const item1 = schedule.addOrUpdateFoodItem(food1.id, { quantity: 200 });
        expect(item1?.quantity, "item1 quantity should be 200").toBe(200);

        const item2 = schedule.addOrUpdateFoodItem(food2.id, { quantity: 200 });
        expect(item2?.quantity, "item2 quantity should be 200").toBe(200);

        if (!item2) throw new Error("item2 not created");

        schedule.setCurrent(item2.id);
        schedule.addOrUpdateFoodItem(food2.id, { quantity: 300 });
        expect(item2.quantity, "item2 quantity updated to 300").toBe(300);

        schedule.setCurrent(-1);

        //
        // --- Create temp dish ---
        //
        schedule.createTempDishFromFood(schedule.items);
        expect(schedule.tempDishFromFood, "temp dish should exist").not.toBeNull();

        const tempDish = schedule.tempDishFromFood!;
        const tempDishId = tempDish.id;
        const idsToDelete = tempDish.items.map(i => i.id);

        //
        // --- Save dish ---
        //
        schedule.saveDishFromTempAndReset();

        //
        // --- DishStore validation ---
        //
        const savedDish = root.dishStore.getEntity(String(tempDishId));
        expect(savedDish, "saved dish must be present in dishStore").toBeTruthy();
        expect(
            savedDish!.items.length,
            "saved dish must contain 2 items"
        ).toBe(2);

        //
        // --- Schedule items validation ---
        //
        expect(
            schedule.items.some(i => i.dishId === String(tempDishId)),
            "schedule must contain the new dish item"
        ).toBe(true);

        idsToDelete.forEach(id => {
            expect(
                schedule.items.some(i => i.id === id),
                `schedule item with id=${id} should be removed after converting to dish`
            ).toBe(false);
        });

        //
        // --- Temp cleanup ---
        //
        expect(
            schedule.tempDishFromFood,
            "tempDishFromFood must be cleared after saving"
        ).toBeNull();
    });
});
