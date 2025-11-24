import { types, flow, cast, Instance, getRoot, SnapshotIn } from "mobx-state-tree"
import {
    getSchedules,
    getOneSchedule,
    addSchedule,
    updateSchedule
} from "@/api/schedule/schedule.api"
import { ISODate } from "@/types/common/common"
import { DaySchedule } from "@/domain/schedule/schedule"
import { createDayScheduleModel } from "@/store/DayScheduleStore/fabric"
import { RequestState } from "@/store/shared/RequestState"
import { Dish } from "@/domain/dish/Dish"
import { createDishModel } from "@/store/DishStore/fabric"
import { RootInstance } from "@/store/store"

export const DishStore = types
    .model("DishStore", {
        // Cache of schedules, keyed by date (ISO)
        data: types.map(Dish),

        // Tracks if schedule exists on backend
        exists: types.map(types.boolean),

        // Request states per date
        request: types.map(RequestState),
    })
    .views(self => ({
        get root(): RootInstance {
            return getRoot(self)
        }
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
        addLocal(init: Parameters<typeof createDishModel>[0]) {
            const model = createDishModel(init);
            self.data.set(model.id, model);
            return model
        },
        addLocalFromSnapshot(snapshot: SnapshotOut<typeof Dish>) {
            self.data.set(snapshot.id, Dish.create(snapshot));
        }
    }))

    // ======== ACTIONS / FLOWS ========
    .actions(self => ({

        // ---- Load all schedules for a month (short data)
        getAllMonthShortData: flow(function* (date: Date) {
            const res = yield getSchedules(date.toISOString())

            if (!res.data) return

            self.exists.clear()
            res.data.forEach(schedule => {
                self.exists.set(schedule.date, true)
            })
        }),

        // ---- Load a single schedule by date
        getOneByDate: flow(function* (date: ISODate) {
            const state = self.ensureRequest(date)
            state.loading = true
            state.error = undefined

            try {
                const res = yield getOneSchedule({ date })
                state.code = res.code

                if (!res.data) {
                    state.error = "Not found"
                    return { data: null, ...state }
                }

                // Fill domain model
                self.data.set(date, DaySchedule.create(res.data))
                return { data: res.data, ...state }

            } catch (e) {
                state.error = String(e)
                return { data: null, ...state }
            } finally {
                state.loading = false
            }
        }),

        // ---- Create a schedule
        create: flow(function* (payload: DayScheduleUI) {
            const date = payload.date
            const state = self.ensureRequest(date)
            state.loading = true
            state.error = undefined

            try {
                const res = yield addSchedule(payload)
                state.code = res.code

                if (!res.data) {
                    state.error = "Create failed"
                    return { data: null, ...state }
                }

                self.data.set(date, DaySchedule.create(res.data))
                return { data: res.data, ...state }

            } catch (e) {
                state.error = String(e)
                return { data: null, ...state }
            } finally {
                state.loading = false
            }
        }),

        // ---- Update schedule
        update: flow(function* (payload: DayScheduleUI) {
            const date = payload.date
            const state = self.ensureRequest(date)
            state.loading = true
            state.error = undefined

            try {
                const res = yield updateSchedule(payload, payload.id)
                state.code = res.code

                if (!res.data) {
                    state.error = "Update failed"
                    return { data: null, ...state }
                }

                self.data.set(date, DaySchedule.create(res.data))
                return { data: res.data, ...state }

            } catch (e) {
                state.error = String(e)
                return { data: null, ...state }
            } finally {
                state.loading = false
            }
        }),

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
