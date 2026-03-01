import { FoodWithQuantity } from "@/domain/schedule/types";
import { FoodModelStore } from "@/store/models/food/foodModelStore";
import { uiStore } from "@/store/rootStore";
import { domainStore } from "@/store/store";
import { DailyNormsStoreUI } from "@/store/uiStore/dailyNorms/DailyNormsStoreUI";
import { makeAutoObservable } from "mobx";
import { Instance } from "mobx-state-tree";

type FoodId = number
type NutrientId = number

export class NutrientViewModelStore {
    currentFood: {
        quantity: number;
        id: FoodId;
    }[] = [];

    constructor(private dailyNormStoreUI: DailyNormsStoreUI = uiStore.dailyNorms) {
        makeAutoObservable(this);
    }

    sums: Record<string, number> = {}

    setSums = (nutrients: Record<string, number> = {}) => {
        this.sums = nutrients
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
