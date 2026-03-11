
import { ScheduleFoods } from "@/domain/schedule/scheduleFood";
import { Instance } from "mobx-state-tree";

export function createFoodScheduleModel(
    overrides: Partial<Instance<typeof ScheduleFoods>> & { id: string }
) {
    const data = {
        id: overrides.id,
        foods: {
            items: overrides.foods?.items ?? []
        },
    }

    return ScheduleFoods.create(data)
}
