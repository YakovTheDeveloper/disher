import makeInspectable from "mobx-devtools-mst";

import { DayScheduleStore } from "@/store/DayScheduleStore/DayScheduleStore";
import { FoodModelStore } from "@/store/FoodStore/FoodStore";
import { DishStore } from "@/store/DishStore/DishStore";
import { GlobalUiStore } from "@/store/GlobalUiStore/GlobalUiStore";
import { RootInstance, RootStore } from './types'
import { InteractionsService } from "@/store/interactions/InteractionsService";
import { makePersistable } from "@/store/persistance";
import { createNutrientStoreWithInitialData } from "@/store/NutrientStore/NutrientStore";
import { DailyNormStore } from "@/store/DailyNormStore/DailyNormStore";

let _store: RootInstance | undefined;

export const mstEnv = {
    foodStore: FoodModelStore.create(),
}

function createStore(): RootInstance {
    try {
        const store = RootStore.create({
            scheduleStore: DayScheduleStore.create(),
            dishStore: DishStore.create(),
            nutrientStore: createNutrientStoreWithInitialData(),
            interactionsService: InteractionsService.create(),
            dailyNormStore: DailyNormStore.create(),
            globalUiStore: GlobalUiStore.create({ isActionsMode: false }),
        }, mstEnv);

        // Initializations are now async in makePersistable
        // We call them, and they will hydrate the store as snapshots arrive from IndexedDB
        makePersistable(store.dishStore, "dish-store").catch(e => console.error("Error initializing dish-store persistence:", e))
        makePersistable(store.foodStore, "food-store").catch(e => console.error("Error initializing food-store persistence:", e))
        makePersistable(store.scheduleStore, "day-schedule-store").catch(e => console.error("Error initializing day-schedule-store persistence:", e))
        makePersistable(store.dailyNormStore, "daily-norm-store").catch(e => console.error("Error initializing daily-norm-store persistence:", e))

        makeInspectable(store);

        return store;
    } catch (error) {
        console.error("Critical error during RootStore creation:", error);
        // Fallback or re-throw depending on app architecture
        throw error;
    }
}

export const domainStore = _store ?? (_store = createStore());
