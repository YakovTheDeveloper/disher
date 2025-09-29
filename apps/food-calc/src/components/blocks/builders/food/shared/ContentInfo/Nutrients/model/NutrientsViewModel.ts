import { FoodModelStore } from "@/store/models/food/foodModelStore";
import { uiStore } from "@/store/rootStore";
import { DailyNormsStoreUI } from "@/store/uiStore/dailyNorms/DailyNormsStoreUI";
import { makeAutoObservable } from "mobx";

type FoodId = number
type NutrientId = number

export class NutrientViewModelStore {
    currentFood: {
        quantity: number;
        id: FoodId;
    }[] = [];

    constructor(private foodModel: FoodModelStore, private dailyNormStoreUI: DailyNormsStoreUI = uiStore.dailyNorms) {
        makeAutoObservable(this);
    }

    get sums() {
        const acc: Record<FoodId, number> = {};
        this.currentFood.forEach(({ id, quantity: foodQuantity }) => {
            const foodNutrients = this.foodModel.data.get(id.toString())?.nutrients || [];
            foodNutrients.forEach(({ nutrientId, quantity: q }) => {
                acc[nutrientId] = (acc[nutrientId] || 0) + (q * foodQuantity) / 100;
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
        const dailyNormNutrientQuantity = this.dailyNormStoreUI.currentNormNutrients[id]
        console.log(dailyNormNutrientQuantity);
        const noNorm = dailyNormNutrientQuantity == null
        if (noNorm) return null
        const value = this.getValue(id);
        return Math.min(10000, (value / dailyNormNutrientQuantity) * 100);
    };
}