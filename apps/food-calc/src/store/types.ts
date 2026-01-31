import { types, flow, Instance, applySnapshot } from "mobx-state-tree";
import { DayScheduleStore } from "@/store/DayScheduleStore/DayScheduleStore";
import { FoodModelStore } from "@/store/FoodStore/FoodStore";
import { DishStore } from "@/store/DishStore/DishStore";
import { InteractionsService } from "@/store/interactions/InteractionsService";
import { NutrientStore } from "@/store/NutrientStore/NutrientStore";
import { GlobalUiStore } from "@/store/GlobalUiStore/GlobalUiStore";
import { DailyNormStore } from "@/store/DailyNormStore/DailyNormStore";
import { hydrateAndPersist } from "@/store/persistance";

export const RootStore = types
    .model("RootStore", {
        isHydrated: false,
        scheduleStore: DayScheduleStore,
        foodStore: FoodModelStore,
        dishStore: DishStore,
        nutrientStore: NutrientStore,
        dailyNormStore: DailyNormStore,
        interactionsService: InteractionsService,
        globalUiStore: GlobalUiStore,
    })
    .actions(self => {
        const init = flow(function* init() {
            yield Promise.all([
                hydrateAndPersist(self.scheduleStore, "schedule"),

                hydrateAndPersist(self.foodStore, "food", {
                    seed: () => self.foodStore.applySeed(),
                }),

                hydrateAndPersist(self.dishStore, "dish"),

                hydrateAndPersist(self.nutrientStore, "nutrients", {
                    seed: () => self.nutrientStore.applySeed(),
                }),

                hydrateAndPersist(self.dailyNormStore, "dailyNorm", {
                    seed: () => self.dailyNormStore.applySeed(),
                }),
            ])

            self.isHydrated = true
        })

        return {
            afterCreate() {
                init()
            },
        }
    })

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
