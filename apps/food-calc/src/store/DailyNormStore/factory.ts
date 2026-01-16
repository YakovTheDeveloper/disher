import { allNutrientsList } from "@/components/features/builders/food/shared/ContentInfo/Nutrients/constants"
import { DailyNorm, UserDailyNorm } from "@/domain/dailyNorm/DailyNorm.model"
import { generateId } from "@/lib/id/generateId"
import { SnapshotIn } from "mobx-state-tree"

export class DailyNormFactory {

    static createNewLocal(data: Omit<SnapshotIn<typeof DailyNorm>, 'id'>) {
        return UserDailyNorm.create({
            ...data,
            id: generateId(),
            items: createDailyNormItems()
        })
    }

    static createFromServerData(data: SnapshotIn<typeof DailyNorm>) {
        return UserDailyNorm.create({
            ...data,
            items: createDailyNormItemsFromServer(data.items)
        })
    }

    static createPredefined(data: SnapshotIn<typeof DailyNorm>) {
        return DailyNorm.create({
            ...data,
            items: createDailyNormItemsFromServer(data.items)
        })
    }
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
