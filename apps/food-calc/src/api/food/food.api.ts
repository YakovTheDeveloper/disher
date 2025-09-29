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

export const getFoodWithNutrients = async (ids?: number[]) => {
    const payload = ids ? { ids } : undefined
    trpc.getFoodWithNutrients.query(payload)
    return requestWrapper(trpc.getFoodWithNutrients.query, {}, payload)
}

export const getOneFood = async (id: number, date?: string) => {
    return await trpc.getOneFood.query({
        id,
        ...(date ? { date } : {})
    })
}
