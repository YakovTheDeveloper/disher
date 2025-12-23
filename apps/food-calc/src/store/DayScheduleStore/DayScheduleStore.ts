import { types, flow, cast, Instance } from "mobx-state-tree"
import {
    getSchedules,
    getOneSchedule,
    addSchedule,
    updateSchedule,
    syncSchedule,
    syncSchedules
} from "@/api/schedule/schedule.api"
import { ISODate } from "@/types/common/common"
import { DaySchedule } from "@/domain/schedule/schedule"
import { createDayScheduleModel } from "@/store/DayScheduleStore/fabric"
import { RequestState } from "@/store/shared/RequestState"
import { RequestAndSetHandler } from "@/store/common/pureFabrication/RequestAndSet"
import { StatusModel } from "@/store/common/pureFabrication/StatusModel"

export const DayScheduleStore = types
    .model("DayScheduleStore", {
        // Cache of schedules, keyed by date (ISO)
        data: types.map(DaySchedule),

        // Tracks if schedule exists on backend
        exists: types.map(types.boolean),

        // Request states per date
        status: types.optional(StatusModel, {
            fetchGet: {},
            fetchSync: {},
        }),
    })

    // ======== HELPERS ========
    .actions(self => ({
        addLocal(init: Parameters<typeof createDayScheduleModel>[0]) {
            const model = createDayScheduleModel(init);
            self.data.set(model.id, model);
            return model
        },
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
        fetchGetOneByDate: flow(function* (date: ISODate) {
            const byDate = new RequestAndSetHandler(self)
            return yield byDate.load({
                id: date,
                variant: 'fetchGet'
            }, () => getOneSchedule({ date }))
        }),

        // ---- Create a schedule
        fetchSync: async (payload: Instance<typeof DaySchedule>) => {
            const { id } = payload
            const syncRequest = new RequestAndSetHandler(self)
            const result = await syncRequest.load({
                id,
                variant: 'fetchSync'
            }, () => syncSchedules([payload]))
            // self.data.set(date, DaySchedule.create(res.data))

            return result

        },

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

        getLocal(date: ISODate) {
            return self.data.get(date);
        },

        delete(date: ISODate) {
            self.data.delete(date)
        },

    }))
