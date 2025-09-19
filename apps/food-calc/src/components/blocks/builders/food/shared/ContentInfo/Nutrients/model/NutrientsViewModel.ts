import { defaultDailyNorms } from "@/components/blocks/builders/food/shared/ContentInfo/Nutrients/constants";
import { FoodModelStore } from "@/store/models/food/foodModelStore";
import { makeAutoObservable } from "mobx";

export class NutrientViewModelStore {
    currentFood: {
        quantity: number;
        id: number;
    }[] = [];
    foodModel: FoodModelStore;

    constructor(foodModel: FoodModelStore) {
        this.foodModel = foodModel;
        makeAutoObservable(this);
    }

    get sums() {
        const acc: Record<number, number> = {};
        this.currentFood.forEach(({ id, quantity }) => {
            const foodNutrients = this.foodModel.data.get(id.toString())?.nutrients || [];
            foodNutrients.forEach(({ nutrientId, quantity: q }) => {
                acc[nutrientId] = (acc[nutrientId] || 0) + (q * quantity) / 100;
            });
        });
        return acc;
    }

    setCurrentFood = (food: {
        quantity: number;
        id: number;
    }[]) => {
        this.currentFood = food
    }

    getValue = (id: number) => this.sums[id] ?? 0;

    getPercent = (id: number) => {
        const norm = defaultDailyNorms[id];
        const value = this.getValue(id);
        return Math.min(100, (value / norm) * 100);
    };
}