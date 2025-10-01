import { dishFromUI } from "@/api/dish/dish.adapter";
import { requestWrapper } from "@/api/Request";
import { trpc } from "@/api/trpc/trpc"
import { DishUI } from "@/components/blocks/builders/food/DishBuilder/model/DishBuilderViewModel";
import { ApiInputs } from "@types";

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

export const getOneDish = async (id: number) => {
    return trpc.getOneDish.query({ id })
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