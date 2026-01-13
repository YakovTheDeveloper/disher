import { z } from "zod";
import { prisma } from "../../client";
import { createResponseObject } from "../../lib/response";
import { publicProcedure, t } from "../../trpc";
import { AddFoodInputSchema } from "./validation";
import { paginate } from "../../lib/pagination";
import { Food } from "../../generated/prisma";

export const foodRoutes = {
    getFoodByIds: publicProcedure.input(z.object({
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
    getFood: publicProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                limit: z.number().min(1).max(1000).default(50),
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


            const result = await paginate({
                prismaModel: prisma.food,
                page,
                limit,
                where,
                select: { id: true, name: true },
                orderBy: { id: "asc" },
            })

            return createResponseObject(200, 'good', result)


        }),
    getFoodWithNutrients: publicProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                limit: z.number().min(1).max(1000).default(50),
            })
        )
        .query(async ({ input }) => {
            const { page, limit } = input

            const select = {
                id: true,
                name: true,
                description: true,
                nutrients: {
                    select: {
                        nutrientId: true,
                        quantity: true,
                    }
                }
            }

            const [items, total] = await Promise.all([
                prisma.food.findMany({
                    skip: (page - 1) * limit,
                    take: limit,
                    select,
                }),
                prisma.food.count(),
            ])

            const resultItems = items.map(item => {
                // const nutrients = item.nutrients.map(nutrient => ({
                const nutrients = item.nutrients.map(nutrient => ({
                    ...nutrient,
                    nutrientId: nutrient.nutrientId.toString(),
                }))
                // }))
                return { ...item, id: item.id.toString(), description: item.description || '', nutrients }
            })

            const result = {
                items: resultItems, // now strongly typed as TModel[]
                hasMore: page * limit < total,
                total
            }

            return createResponseObject(200, 'good', result)
        }),

    getFoodWithNutrientsByIds: publicProcedure.input(z.object({
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
    getOneFood: publicProcedure.input(
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
    }),
    addFood: publicProcedure
        .input(AddFoodInputSchema)
        .mutation(async ({ input }) => {
            const maxId = await prisma.food.aggregate({ _max: { id: true } });
            const newId = (maxId._max.id ?? 0) + 1;

            try {
                // 1️⃣ Create the Food record
                const food = await prisma.food.create({
                    data: {
                        id: newId,
                        name: input.name,
                        nameEng: input.nameEng,
                        description: input.description ?? "",
                        descriptionEng: input.descriptionEng ?? "",
                        nutrients: {
                            create: input.nutrients.map((n) => ({
                                quantity: n.value,
                                nutrientId: n.id,
                            })),
                        },
                    },
                    include: {
                        nutrients: {
                            select: {
                                quantity: true,
                                nutrientId: true,
                            },
                        },
                    },
                });

                return createResponseObject(200, "Food created successfully", food);
            } catch (error) {
                console.error("addFood error:", error);
                return createResponseObject(500, "Error creating food", error);
            }
        }),
}