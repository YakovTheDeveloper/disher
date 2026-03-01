import { ScheduleFood } from "@/domain/schedule/schedule.model";
import { ISODate } from "@/types/common/common";
import { Instance } from "mobx-state-tree";

export function createFoodScheduleModel(
    overrides: Partial<Instance<typeof ScheduleFood>> & { id: ISODate }
) {
    const data = {
        id: overrides.id,
        userId: overrides.userId ?? 0,
        foods: {
            items: overrides.foods?.items ?? []
        },
        lastSync: overrides.lastSync ?? ''
    }

    return ScheduleFood.create(data)
}
