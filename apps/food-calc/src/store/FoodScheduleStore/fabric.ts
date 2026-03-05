
import { ScheduleFoods } from "@/domain/schedule/scheduleFood";
import { ISODate } from "@/types/common/common";
import { Instance } from "mobx-state-tree";

export function createFoodScheduleModel(
    overrides: Partial<Instance<typeof ScheduleFoods>> & { id: ISODate }
) {
    const data = {
        id: overrides.id,
        foods: {
            items: overrides.foods?.items ?? []
        },
    }

    return ScheduleFoods.create(data)
}
