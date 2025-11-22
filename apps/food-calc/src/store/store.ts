import { types, Instance } from "mobx-state-tree";
import makeInspectable from "mobx-devtools-mst";

import { DayScheduleStore } from "@/store/DayScheduleStore/DayScheduleStore";
import { FoodModelStore } from "@/store/FoodStore/FoodStore";

const DomainStore = types.model("DomainStore", {
    daySchedule: types.optional(DayScheduleStore, {}),
    foodStore: types.optional(FoodModelStore, {}),
});

export type DomainStoreType = Instance<typeof DomainStore>;

let _store: DomainStoreType | undefined;

function createStore() {
    const store = DomainStore.create({
        daySchedule: DayScheduleStore.create(),
        foodStore: FoodModelStore.create(),
    });

    makeInspectable(store);
    return store;
}

export const domainStore = _store ?? (_store = createStore());
