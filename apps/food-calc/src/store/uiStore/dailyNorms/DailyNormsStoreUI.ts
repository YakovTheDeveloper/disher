import { DailyNormModelStore } from "@/store/models/dailyNorm/dailyNorm.model";
import { makeAutoObservable } from "mobx";
import { defaultNorms, STANDARD_NORM_ID } from './data'
// type DefaultNorms = typeof STANDARD_NORM_ID | typeof STANDARD_NORM_ID_2

export class DailyNormsStoreUI {
    currentNormId: number | string = STANDARD_NORM_ID;

    constructor(private modelStore: DailyNormModelStore) {
        makeAutoObservable(this);
    }

    setCurrentNorm(norm: typeof this.currentNormId) {
        this.currentNormId = norm;
    }

    get currentNorm() {
        const id = this.currentNormId.toString()
        return this.modelStore.data.get(id)
            || this.defaultNorms[id]
    }

    get currentNormNutrients() {
        return this.currentNorm.items.reduce<Record<number, number | null>>((acc, item) => {
            acc[item.nutrientId] = item.quantity;
            return acc;
        }, {});
    }

    defaultNorms = defaultNorms
    defaultNormsCollection = Object.values(defaultNorms)
}
