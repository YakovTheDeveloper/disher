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
import { DaySchedule, ScheduleItem } from "@/domain/schedule/schedule"
import { createDayScheduleModel } from "@/store/DayScheduleStore/fabric"
import { createRequestController } from "@/store/common/pureFabrication/createRequestController"
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

        fetchSync: async (payload: Instance<typeof DaySchedule>) => {
            const { id } = payload

            const syncRequest = createRequestController({
                getState: (id: string, variant: string) => self.status[variant].get(id)
            })

            const result = await syncRequest.run({
                id,
                variant: 'fetchSync'
            }, () => syncSchedules([payload]))

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

        has(date: string) {
            return self.data.has(date);
        },

        delete(date: ISODate) {
            self.data.delete(date)
        }
    }))
