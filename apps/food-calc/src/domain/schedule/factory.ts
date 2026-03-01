import { DaySchedule } from "@/domain/schedule/schedule.model"
import { Instance } from "mobx-state-tree";

export const ScheduleFactory = {
    createSchedule(overrides: Partial<Instance<typeof DaySchedule>> & { id: ISODate }) {
        const data = {
            id: overrides.id,
            userId: overrides.userId ?? 0,
            foods: {
                items: overrides.foods ?? []
            },
            events: {
                items: overrides.events ?? []
            },
            lastSync: ''
        }

        return DaySchedule.create(data)
    }
}
