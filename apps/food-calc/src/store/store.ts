import makeInspectable from "mobx-devtools-mst";

import { FoodModelStore } from "@/store/FoodStore/FoodStore";
import { RootInstance, RootStore } from './types'

let _store: RootInstance | undefined;

export const mstEnv = {
    foodStore: FoodModelStore.create(),
}

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

export const useStore = () => domainStore;