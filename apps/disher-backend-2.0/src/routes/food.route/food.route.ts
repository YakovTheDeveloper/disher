import { z } from "zod";
import { prisma } from "../../client";
import { createResponseObject } from "../../lib/response";
import { t } from "../../trpc";

export const foodRoutes = {
    getFood: t.procedure.input(z.object({
        ids: z.array(z.number()).optional(),
    }).optional()).query(async ({ input }) => {
        const result = await prisma.food.findMany({
            select: {
                id: true,
                name: true,
            },
            ...(input?.ids ? {
                where: {
                    id: {
                        in: input.ids
                    }
                }
            } : {}),
        })
        return createResponseObject(200, 'good', result)
    }),
    getFoodWithNutrients: t.procedure.input(z.object({
        ids: z.array(z.number()).optional(),
    }).optional()).query(async ({ input }) => {
        const result = await prisma.food.findMany({
            select: {
                id: true,
                name: true,
                nutrients: {
                    select: {
                        nutrientId: true,
                        quantity: true,
                    }
                }
            },
            ...(input?.ids ? {
                where: {
                    id: {
                        in: input.ids
                    }
                }
            } : {}),
        })
        return createResponseObject(200, 'good', result)
    }),
    getOneFood: t.procedure.input(
        z.object({
            id: z.number()
        })
    ).query(async ({ input }) => {
        const whereCondition = {
            id: input.id
        }

        const result = await prisma.food.findFirst({
            select: {
                id: true,
                name: true,
                nutrients: {
                    select: {
                        quantity: true,
                        nutrientId: true
                    }
                }

            },
            where: whereCondition
        })
        return createResponseObject(200, 'good', result)
    })
}