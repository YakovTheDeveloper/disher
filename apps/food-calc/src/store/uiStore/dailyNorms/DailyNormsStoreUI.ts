import { defaultDailyNorms } from "@/components/blocks/builders/food/shared/ContentInfo/Nutrients/constants";
import { DailyNormModelStore } from "@/store/models/dailyNorm/dailyNorm.model";
import { makeAutoObservable } from "mobx";

export class DailyNormsStoreUI {
    currentNormId: number | null = null;

    constructor(private modelStore: DailyNormModelStore) {
        makeAutoObservable(this);
    }

    setCurrentNorm(norm: number) {
        this.currentNormId = norm;
    }

    get currentNorm() {
        if (!this.currentNormId) return defaultDailyNorms
        this.modelStore.data.get(this.currentNormId.toString())
    }
}