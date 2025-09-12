import { prisma } from "../../client";
import { createResponseObject } from "../../lib/response";
import { t } from "../../trpc";

export const foodRoutes = {
    getFood: t.procedure.query(async () => {
        const result = await prisma.food.findMany({
            select: {
                id: true,
                name: true,
            }
        })
        return createResponseObject(200, 'good', result)
    })
}