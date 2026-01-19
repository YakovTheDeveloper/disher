import { types, Instance } from "mobx-state-tree";
import { DayScheduleStore } from "@/store/DayScheduleStore/DayScheduleStore";
import { FoodModelStore } from "@/store/FoodStore/FoodStore";
import { DishStore } from "@/store/DishStore/DishStore";
import { InteractionsService } from "@/store/interactions/InteractionsService";
import { NutrientStore } from "@/store/NutrientStore/NutrientStore";
import { GlobalUiStore } from "@/store/GlobalUiStore/GlobalUiStore";
import { DailyNormStore } from "@/store/DailyNormStore/DailyNormStore";

export const RootStore = types.model("RootStore", {
    scheduleStore: types.optional(DayScheduleStore, {}),
    foodStore: types.optional(FoodModelStore, {}),
    dishStore: types.optional(DishStore, {}),
    nutrientStore: types.optional(NutrientStore, {}),
    interactionsService: types.optional(InteractionsService, {}),
    globalUiStore: types.optional(GlobalUiStore, { isActionsMode: false }),
    dailyNormStore: types.optional(DailyNormStore, {}),
});

export type RootInstance = Instance<typeof RootStore>;

export type DishStoreInstance = Instance<typeof DishStore>;

export interface DishStoreApi {
    addLocal: DishStoreInstance["addLocal"];
    getById: DishStoreInstance["getById"];
    fetchSync: DishStoreInstance["fetchSync"];
}

export interface NutrientStoreApi {
    items: Instance<typeof NutrientStore>["items"];
}

export interface DayScheduleApi {
    getLocal: Instance<typeof DayScheduleStore>["getLocal"];
}
