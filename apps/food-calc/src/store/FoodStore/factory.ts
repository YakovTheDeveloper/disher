import { Food } from "@/domain/Food"
import { Instance } from "mobx-state-tree"

export function createFoodModel(
    overrides: Partial<Instance<typeof Food>>
) {
    const data = {
        id: overrides.id || Math.floor(Math.random() * 1_000_000).toString(),
        name: overrides.name || '',
        ...(overrides.nutrients ? { nutrients: overrides.nutrients } : {})
    }

    return Food.create(data)
}
