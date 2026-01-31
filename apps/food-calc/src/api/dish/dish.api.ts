import { extractChanges } from "@/api/adapters/common";
import { dishFromUI } from "@/api/dish/dish.adapter";
import { requestWrapper } from "@/api/Request";
import { trpc } from "@/api/trpc/trpc"
import { DishUI } from "@/components/features/builders/DishBuilder/model/DishBuilderViewModel";
import { Dish } from "@/domain/dish/Dish.model";
import { ApiInputs } from "@types";
import { getSnapshot, Instance } from "mobx-state-tree";

export type GetWithParams = {
    ids?: number[]
    page?: number
    limit?: number
    filters?: {
        category?: string
        search?: string
    }
}

export const getDishes = async (params: GetWithParams) => {
    return await requestWrapper(trpc.getDishes.query, {}, params)
}

export const getDishById = async (id: string[] | string) => {
    return await requestWrapper(trpc.getDish.query, {}, { id })

}

export const addDish = async (data: DishUI) => {
    const dish = dishFromUI(data, "createDish")

    const payload: ApiInputs.DishCreateWithoutUserInput = {
        name: dish.name,
        items: {
            createMany: { data: dish.items }
        }
    }
    const result = await trpc.addDish.mutate(payload);
    return result.data
}

export const updateDish = async (data: DishUI) => {

    const { id, items, name } = dishFromUI(data, 'updateDish')

    const result = await trpc.updateDish.mutate({ id, name, items });
    return result.data
}

export const syncDishes = async (dishes: Instance<typeof Dish>[]) => {

    const payload: Parameters<typeof trpc.syncDish.mutate>[0] = {
        dishes: dishes.map((dish) => {
            const { items, isDraft, name, id } = getSnapshot(dish);
            const { added, deleted, modified } = dish.delta
            const userId = 1
            return {
                id,
                userId,
                items: {
                    create: added,
                    delete: deleted,
                    update: modified
                },
                name
            }
        }),
    }

    const result = await trpc.syncDish.mutate(payload);
    return result.data
}
