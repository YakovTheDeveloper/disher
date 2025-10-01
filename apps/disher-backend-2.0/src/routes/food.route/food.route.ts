import { z } from "zod";
import { prisma } from "../../client";
import { createResponseObject } from "../../lib/response";
import { t } from "../../trpc";

export const foodRoutes = {
    getFoodByIds: t.procedure.input(z.object({
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
    getFood: t.procedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                limit: z.number().min(1).max(100).default(50),
                filters: z
                    .object({
                        category: z.string().optional(),
                        search: z.string().optional(),
                    })
                    .optional(),
            })
        )
        .query(async ({ input }) => {
            const { page, limit, filters } = input

            const where: any = {}
            if (filters?.category) where.category = filters.category
            if (filters?.search)
                where.name = { contains: filters.search, mode: "insensitive" }
            const [items, total] = await Promise.all([
                prisma.food.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    select: { id: true, name: true },
                    orderBy: { id: "asc" },
                }),
                prisma.food.count({ where }),
            ])

            const hasMore = page * limit < total

            const result = {
                items,
                hasMore,
            }

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