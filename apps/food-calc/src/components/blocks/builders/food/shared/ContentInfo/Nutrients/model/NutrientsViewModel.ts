import { defaultDailyNorms } from "@/components/blocks/builders/food/shared/ContentInfo/Nutrients/constants";
import { FoodModelStore } from "@/store/models/food/foodModelStore";
import { makeAutoObservable } from "mobx";

type FoodId = number
type NutrientId = number

export class NutrientViewModelStore {
    currentFood: {
        quantity: number;
        id: FoodId;
    }[] = [];
    foodModel: FoodModelStore;

    constructor(foodModel: FoodModelStore) {
        this.foodModel = foodModel;
        makeAutoObservable(this);
    }

    get sums() {
        const acc: Record<FoodId, number> = {};
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
        id: FoodId;
    }[]) => {
        this.currentFood = food
    }

    getValue = (id: FoodId) => this.sums[id] ?? 0;

    getPercent = (id: NutrientId) => {
        const norm = defaultDailyNorms[id];
        const value = this.getValue(id);
        return Math.min(100, (value / norm) * 100);
    };
}