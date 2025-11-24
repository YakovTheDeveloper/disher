import { Dish } from "@/domain/dish/Dish";
import { ISODate } from "@/types/common/common";
import { Instance, SnapshotIn } from "mobx-state-tree";

export function createDishModel(
    overrides: Partial<SnapshotIn<typeof Dish>> & { isDraft: boolean }
) {
    const data = {
        name: overrides.name ?? '',
        id: Math.floor(Math.random() * 1_000_000).toString(),
        userId: overrides.userId ?? 0,
        items: overrides.items ?? [],
        currentId: overrides.currentId ?? -1,
        isDraft: overrides.isDraft
    }

    return Dish.create(data)
}
