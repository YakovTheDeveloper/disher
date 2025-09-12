import { trpc } from "@/api/trpc/trpc"

export const getFood = async () => {
    return await trpc.getFood.query()
}
