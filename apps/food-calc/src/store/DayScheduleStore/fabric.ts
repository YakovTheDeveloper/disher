import { DaySchedule } from "@/domain/schedule/schedule";
import { ISODate } from "@/types/common/common";
import { Instance } from "mobx-state-tree";

export function createDayScheduleModel(
    overrides: Partial<Instance<typeof DaySchedule>> & { date: ISODate, isDraft: boolean }
) {
    const data = {
        id: Math.floor(Math.random() * 1_000_000),
        date: overrides.date,
        userId: overrides.userId ?? 0,
        dailyEvents: overrides.dailyEvents ?? null,
        items: overrides.items ?? [],
        currentId: overrides.currentId ?? -1,
        isDraft: overrides.isDraft
    }

    return DaySchedule.create(data)
}
