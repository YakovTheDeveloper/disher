import { requestWrapper } from "@/api/Request"
import { trpc } from "@/api/trpc/trpc"
import { DailyNormEntityUI } from "@/components/blocks/DailyNorms/viewModel/DailyNormsViewModel"

export const getDailyNorms = async () => {
    return requestWrapper(trpc.getDailyNorms.query, {})

}

type Update = {
    id: number
    items: { quantity: number | null; nutrientId: number }[];
    description: string;
    name: string;
}

export const updateDailyNorm = async (payload: DailyNormEntityUI) => {
    return await requestWrapper(trpc.updateDailyNorms.mutate, {}, updatePayload(payload));
};

export const createDailyNorm = async (payload: DailyNormEntityUI) => {
    return await requestWrapper(trpc.createDailyNorms.mutate, {}, createPayload(payload))
}

export const removeDailyNorm = async (id: number) => {
    return await requestWrapper(trpc.removeDailyNorm.mutate, {}, { id })
}

const createPayload = (payload: DailyNormEntityUI) => {
    const { description, items, name, id } = payload
    return {
        name,
        description,
        items,
    }
}

const updatePayload = (payload: DailyNormEntityUI) => {
    const { description, items, name, id } = payload
    return {
        name,
        description,
        items,
        id: Number(id)
    }
}