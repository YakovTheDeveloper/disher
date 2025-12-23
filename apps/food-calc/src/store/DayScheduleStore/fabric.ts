import { DaySchedule } from "@/domain/schedule/schedule";
import { ISODate } from "@/types/common/common";
import { Instance } from "mobx-state-tree";

export function createDayScheduleModel(
    overrides: Partial<Instance<typeof DaySchedule>> & { id: ISODate }
) {
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
