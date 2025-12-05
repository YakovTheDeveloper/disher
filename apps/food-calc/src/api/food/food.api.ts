import { requestWrapper } from "@/api/Request"
import { trpc } from "@/api/trpc/trpc"

export type GetFoodParams = {
    ids?: number[]
    page?: number
    limit?: number
    filters?: {
        category?: string
        search?: string
    }
}

export const getFoodList = async (params: GetFoodParams) => {
    return await requestWrapper(trpc.getFood.query, {}, params)
}

export const getFoodWithNutrientsByIds = async (ids?: string[]) => {
    const payload = ids ? { ids: ids.map(id => +id) } : undefined
    trpc.getFoodWithNutrientsByIds.query(payload)
    return requestWrapper(trpc.getFoodWithNutrientsByIds.query, {}, payload)
}

export const getFoodWithNutrients = async (params: GetFoodParams) => {
    return requestWrapper(trpc.getFoodWithNutrients.query, {}, params)
}

export const getOneFood = async (id: number, date?: string) => {
    return await trpc.getOneFood.query({
        id,
        ...(date ? { date } : {})
    })
}

export const addFood = async (payload: any) => {
    return await trpc.addFood.mutate(payload)
}
