import { requestWrapper } from "@/api/Request"
import { trpc } from "@/api/trpc/trpc"

export const getFood = async (ids?: number[]) => {
    const payload = ids ? { ids } : undefined
    return requestWrapper(trpc.getFood.query, {}, payload)

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
