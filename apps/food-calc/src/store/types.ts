import { types, Instance } from "mobx-state-tree";
import { DayScheduleStore } from "@/store/DayScheduleStore/DayScheduleStore";
import { FoodModelStore } from "@/store/FoodStore/FoodStore";
import { DishStore } from "@/store/DishStore/DishStore";
import { InteractionsService } from "@/store/interactions/InteractionsService";

export const RootStore = types.model("RootStore", {
    daySchedule: types.optional(DayScheduleStore, {}),
    foodStore: types.optional(FoodModelStore, {}),
    dishStore: types.optional(DishStore, {}),
    interactionsService: types.optional(InteractionsService, {}),
});

export type RootInstance = Instance<typeof RootStore>;

export type DishStoreInstance = Instance<typeof DishStore>;

export interface DishStoreApi {
    addLocal: DishStoreInstance["addLocal"];
    getLocal: DishStoreInstance["getLocal"];
}

export interface DayScheduleApi {
    getLocal: Instance<typeof DayScheduleStore>["getLocal"];
}