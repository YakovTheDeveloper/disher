import makeInspectable from "mobx-devtools-mst";

import { FoodModelStore, FoodStoreInstance } from "@/store/FoodStore/FoodStore";
import { RootInstance, RootStore } from './RootStoreModel'

let _store: RootInstance | undefined;

export const mstEnv = {
    foodStore: undefined as FoodStoreInstance | undefined
};

function createStore(): RootInstance {
    try {
        const store = RootStore.create({
            scheduleStore: {},
            dishStore: {},
            nutrientStore: {},
            interactionsService: {},
            dailyNormStore: {},
            globalUiStore: {},
            foodStore: {}
        }, mstEnv);

        makeInspectable(store);

        return store;
    } catch (error) {
        console.error("Critical error during RootStore creation:", error);
        // Fallback or re-throw depending on app architecture
        throw error;
    }
}

export const domainStore = _store ?? (_store = createStore());
mstEnv.foodStore = domainStore.foodStore;

export const useStore = () => domainStore;