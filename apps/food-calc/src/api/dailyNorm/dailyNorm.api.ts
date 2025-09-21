import { requestWrapper } from "@/api/Request"
import { trpc } from "@/api/trpc/trpc"

export const getDailyNorms = async () => {
    return requestWrapper(trpc.getDailyNorms.query, {})

}

type Update = {
    id: number
    items: { quantity: number; nutrientId: number }[];
    description: string;
    name: string;
}

export const updateDailyNorm = async (payload: Update) => {
    return await requestWrapper(trpc.updateDailyNorms.mutate, {}, payload);
};

export const createDailyNorm = async (payload: Omit<Update, 'id'>) => {
    return await requestWrapper(trpc.createDailyNorms.mutate, {}, payload)
}

export const removeDailyNorm = async (id: number) => {
    return await requestWrapper(trpc.removeDailyNorm.mutate, {}, { id })
}
