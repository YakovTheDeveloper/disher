import makeInspectable from "mobx-devtools-mst";

import { DayScheduleStore } from "@/store/DayScheduleStore/DayScheduleStore";
import { FoodModelStore } from "@/store/FoodStore/FoodStore";
import { DishStore } from "@/store/DishStore/DishStore";
import { RootInstance, RootStore } from './types'
import { InteractionsService } from "@/store/interactions/InteractionsService";
import { makePersistable } from "@/store/persistance";
import { createNutrientStoreWithInitialData } from "@/store/NutrientStore/NutrientStore";

let _store: RootInstance | undefined;

function createStore(): RootInstance {
    const store = RootStore.create({
        daySchedule: DayScheduleStore.create(),
        foodStore: FoodModelStore.create(),
        dishStore: DishStore.create(),
        nutrientStore: createNutrientStoreWithInitialData(),
        interactionsService: InteractionsService.create(),
    });

    makePersistable(store.dishStore, "dish-store")
    makePersistable(store.foodStore, "food-store")
    makePersistable(store.daySchedule, "day-schedule-store")

    makeInspectable(store);
    return store;
}

export const domainStore = _store ?? (_store = createStore());
