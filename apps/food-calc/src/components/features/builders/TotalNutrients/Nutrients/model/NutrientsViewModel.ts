// TODO: full rewrite needed — this class was heavily MST-dependent
// It relied on FoodModelStore, uiStore, DailyNormsStoreUI from MST.
// Needs to be reimplemented using Triplit queries.

import { makeAutoObservable } from "mobx";

type FoodId = number
type NutrientId = number

export class NutrientViewModelStore {
    currentFood: {
        quantity: number;
        id: FoodId;
    }[] = [];

    constructor(private dailyNormStoreUI: any = null) {
        makeAutoObservable(this);
    }

    sums: Record<string, number> = {}

    setSums = (nutrients: Record<string, number> = {}) => {
        this.sums = nutrients
    }

    getValue = (id: FoodId) => this.sums[id] ?? 0;

    getPercent = (id: NutrientId) => {
        if (!this.dailyNormStoreUI) return null;
        const dailyNormNutrientQuantity = this.dailyNormStoreUI.currentNormNutrients?.[id]
        const noNorm = dailyNormNutrientQuantity == null
        if (noNorm) return null
        const value = this.getValue(id);
        return Math.min(10000, (value / dailyNormNutrientQuantity) * 100);
    };
}
