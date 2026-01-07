import makeInspectable from "mobx-devtools-mst";

import { DayScheduleStore } from "@/store/DayScheduleStore/DayScheduleStore";
import { FoodModelStore } from "@/store/FoodStore/FoodStore";
import { DishStore } from "@/store/DishStore/DishStore";
import { GlobalUiStore } from "@/store/GlobalUiStore/GlobalUiStore";
import { RootInstance, RootStore } from './types'
import { InteractionsService } from "@/store/interactions/InteractionsService";
import { makePersistable } from "@/store/persistance";
import { createNutrientStoreWithInitialData } from "@/store/NutrientStore/NutrientStore";

let _store: RootInstance | undefined;

export const mstEnv = {
    foodStore: FoodModelStore.create(),
}

function createStore(): RootInstance {
    const store = RootStore.create({
        scheduleStore: DayScheduleStore.create(),
        dishStore: DishStore.create(),
        nutrientStore: createNutrientStoreWithInitialData(),
        interactionsService: InteractionsService.create(),
        globalUiStore: GlobalUiStore.create({ isActionsMode: false }),
    }, mstEnv);

    makePersistable(store.dishStore, "dish-store")
    makePersistable(store.foodStore, "food-store")
    makePersistable(store.scheduleStore, "day-schedule-store")
    makeInspectable(store);

    return store;
}

export const domainStore = _store ?? (_store = createStore());
