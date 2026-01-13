import { types, flow, cast, Instance, getRoot, SnapshotIn } from "mobx-state-tree"
import {
    getSchedules,
    getOneSchedule,
    addSchedule,
    updateSchedule
} from "@/api/schedule/schedule.api"
import { ISODate } from "@/types/common/common"
import { DaySchedule, ScheduleItem } from "@/domain/schedule/schedule"
import { createDayScheduleModel } from "@/store/DayScheduleStore/fabric"
import { RequestState } from "@/store/shared/RequestState"
import { Dish } from "@/domain/dish/Dish"
import { createDishModel } from "@/store/DishStore/fabric"
import { RootInstance } from "@/store/store"
import { getDishById, syncDishes } from "@/api/dish/dish.api"
import { RequestAndSetHandler } from "@/store/common/pureFabrication/RequestAndSet"
import { StatusModel } from "@/store/common/pureFabrication/StatusModel"

type AddLocalType = {
    variant: 'fromSnapshot',
    payload: Partial<SnapshotIn<typeof Dish>>
} | {
    variant: 'fromScheduleFood'
    payload: Instance<typeof ScheduleItem>[]
}

export const DishStore = types
    .model("DishStore", {
        // Cache of schedules, keyed by date (ISO)
        data: types.map(Dish),

        // Tracks if schedule exists on backend
        exists: types.map(types.boolean),

        // Request states per date
        request: types.map(RequestState),
        status: types.optional(StatusModel, {
            fetchGet: {},
            fetchSync: {},
        }),
    })
    .views(self => ({
        get root(): RootInstance {
            return getRoot(self)
        },
        get list() {
            return Array.from(self.data.values());
        },
    }))
    // ======== HELPERS ========
    .actions(self => ({
        ensureRequest(date: ISODate) {
            if (!self.request.has(date)) {
                self.request.set(
                    date,
                    RequestState.create({ loading: false, error: undefined })
                )
            }
            return self.request.get(date)!
        },

        addLocal(init: AddLocalType) {
            const { variant, payload } = init
            if (variant === 'fromSnapshot') {
                const model = createDishModel(payload);
                self.data.set(model.id, model);
                return model
            }
            if (variant === 'fromScheduleFood') {
                const onlyFoodItems = payload
                    .filter(el => el.content.variant === 'food' && el.sync.status !== 'deleted')
                    .map(el => ({
                        id: el.id,
                        foodId: String(el.content.foodId),
                        food: String(el.content.foodId),
                        quantity: el.quantity,
                        status: "added" as const,
                    }));

                const init = {
                    items: onlyFoodItems,
                }
                const model = createDishModel(init);
                self.data.set(model.id, model);
                return model
            }
        },

        // addLocalFromSnapshot(snapshot: SnapshotOut<typeof Dish>) {
        //     self.data.set(snapshot.id, Dish.create(snapshot));
        // },

        fetchSync: async (payload: Instance<typeof Dish>[]) => {
            const syncRequest = new RequestAndSetHandler(self);
            return await syncRequest.load(
                payload.map(x => ({ id: x.id, variant: "fetchSync" })),
                () => syncDishes(payload)
            );
        },

        fetchGet: async (id: string) => {
            const syncRequest = new RequestAndSetHandler(self);
            return await syncRequest.load(
                [{ id, variant: "fetchGet" }],
                () => getDishById(id)
            );
        },

    }))

    // ======== ACTIONS / FLOWS ========
    .actions(self => ({

        // ---- Local update (no backend call)
        updateDailyEventsLocal(date: ISODate, payload: string | null) {
            const item = self.data.get(date)
            if (!item) return
            item.dailyEvents = payload
        },

        // ---- Manual setters if needed
        set(date: ISODate, schedule: unknown) {
            self.data.set(date, cast(schedule))
        },
        getLocal(id: string) {
            return self.data.get(id);
        },

        delete(date: ISODate) {
            self.data.delete(date)
        },
    }))
