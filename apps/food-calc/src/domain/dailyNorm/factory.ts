import { allNutrientsList } from "@/components/entities/nutrient/NutrientGroup/constants"
import { DailyNorm } from "@/domain/dailyNorm/DailyNorm.model"
import { generateId } from "@/lib/id/generateId"
import { StoreEntityFactory } from "@/store/types/factory"
import { Instance, SnapshotIn } from "mobx-state-tree"

export const DailyNormsFactory: StoreEntityFactory<typeof DailyNorm> = {
    createNewLocal(data: Omit<SnapshotIn<typeof DailyNorm>, 'id'>) {
        return DailyNorm.create({
            ...data,
            id: generateId(),
            items: createDailyNormItems()
        })
    },

    createFromServerData(data: SnapshotIn<typeof DailyNorm>) {
        return DailyNorm.create({
            ...data,
            items: createDailyNormItemsFromServer(data.items)
        })
    },
}

export function createDailyNormItems() {
    const dailyNormItems = allNutrientsList.map(nutrient => ({
        id: generateId(),
        nutrientId: nutrient.id,
        quantity: null
    }));
    return dailyNormItems
}

export function createDailyNormItemsFromServer(items: SnapshotIn<typeof DailyNorm>['items']) {
    if (!items) return createDailyNormItems()

    const itemMap = new Map(items.map(item => [item.nutrientId, { id: item.id, quantity: item.quantity }]))
    const dailyNormItems = []

    for (const nutrient of allNutrientsList) {
        const existing = itemMap.get(nutrient.id)
        if (existing) {
            dailyNormItems.push({
                id: existing.id,
                nutrientId: nutrient.id,
                quantity: existing.quantity ?? null
            })
        }
    }
    return dailyNormItems
}
