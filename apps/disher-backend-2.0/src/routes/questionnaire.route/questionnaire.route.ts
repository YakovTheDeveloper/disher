import { prisma } from "../../client.js"
import { createResponseObject } from "../../lib/response.js"
import { t } from "../../trpc.js"

export const questionnaireRoute = {
    getOne: t.procedure.query(async () => {
        const result = await prisma.food.findMany({
            select: {
                id: true,
                name: true,
            }
        })
        return createResponseObject(200, 'good', result)
    })
}