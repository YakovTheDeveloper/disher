import { types, flow, Instance } from "mobx-state-tree";
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
            console.log("[RootStore] Starting initialization...");

            try {
                // 1. Load foodStore first (others depend on it)
                console.log("[RootStore] Loading foodStore first...");
                yield hydrateAndPersist(self.foodStore, "food", {
                    seed: () => self.foodStore.applySeed(),
                });

                // 2. Load independent stores in parallel
                console.log("[RootStore] Loading nutrientStore and dailyNormStore...");
                yield Promise.all([
                    hydrateAndPersist(self.nutrientStore, "nutrients", {
                        seed: () => self.nutrientStore.applySeed(),
                    }),
                    hydrateAndPersist(self.dailyNormStore, "dailyNorm", {
                        seed: () => self.dailyNormStore.applySeed(),
                    }),
                ]);

                // 3. Load stores that may depend on foodStore
                console.log("[RootStore] Loading dishStore...");
                yield hydrateAndPersist(self.dishStore, "dish");

                // 4. Load scheduleStore last (may depend on foodStore and dishStore)
                console.log("[RootStore] Loading scheduleStore...");
                yield hydrateAndPersist(self.scheduleStore, "schedule");

                // 5. UI stores (optional persistence)
                console.log("[RootStore] Loading globalUiStore...");
                yield hydrateAndPersist(self.globalUiStore, "globalUi");

                console.log("[RootStore] All stores loaded successfully");

            } catch (error) {
                console.error("[RootStore] Error during initialization:", error);
            }

            self.isHydrated = true;
            console.log("[RootStore] isHydrated = true");
        });

        return {
            afterCreate() {
                init();
            },
        };
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