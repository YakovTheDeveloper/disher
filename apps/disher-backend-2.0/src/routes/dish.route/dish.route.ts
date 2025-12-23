

import z from "zod"
import { prisma } from "../../client"
import { idStringifier, publicProcedure, t } from "../../trpc"
import { DishCreateWithoutUserInputSchema, DishItemCreateManyDishInputSchema, ScheduleCreateWithoutUserInputSchema, ScheduleItemCreateManyScheduleInputSchema } from "../../../prisma/generated/zod"
import { createResponseObject } from "../../lib/response"
import { DishSyncInputZod, DishZodType } from "./dish.validation"
import { getCreateItems, getUpdateItems } from "./dish.service"

export const dihesRoutes = {
    getDishes: publicProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                limit: z.number().min(1).max(100).default(50),
                filters: z
                    .object({
                        search: z.string().optional(),
                        // userId: z.number().optional(), // optional user filter if needed
                    })
                    .optional(),
            })
        )
        .query(async ({ input }) => {
            const { page, limit, filters } = input

            const where: any = {}
            // if (filters?.userId) where.user = { id: filters.userId }
            where.user = { id: 1 }
            if (filters?.search)
                where.name = { contains: filters.search, mode: 'insensitive' }

            const [items, total] = await Promise.all([
                prisma.dish.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    select: dishSelect,
                    orderBy: { id: 'asc' },
                }),
                prisma.dish.count({ where }),
            ])

            const hasMore = page * limit < total

            const result = {
                items,
                hasMore,
            }

            return createResponseObject(200, 'good', result)
        }),
    getDish: publicProcedure
        .input(
            z.object({
                id: z.union([
                    z.string(),
                    z.array(z.string()),
                ]),
            })
        )
        .query(async ({ input }) => {
            const ids = Array.isArray(input.id) ? input.id : [input.id];

            const result = await prisma.dish.findMany({
                where: {
                    id: { in: ids },
                },
                select: {
                    id: true,
                    items: true,
                    name: true,
                },
            });

            return createResponseObject(200, 'good', result);
        }),
    syncDish: publicProcedure
        .input(DishSyncInputZod)
        .mutation(async ({ input, ctx }) => {
            const results = [];
            const notSync = []
            for (const dish of input.dishes) {
                try {


                    const result = await prisma.$transaction(async (tx) => {
                        let existingDish = await prisma.dish.findUnique({
                            where: { id: dish.id },
                        });

                        if (existingDish) {
                            await tx.dish.update({
                                where: { id: dish.id },
                                data: {
                                    name: dish.name,
                                    userId: dish.userId,
                                    updatedAt: new Date(),
                                },
                            });
                        } else {
                            existingDish = await tx.dish.create({
                                data: {
                                    id: dish.id, // client-first id
                                    name: dish.name,
                                    userId: dish.userId,
                                },
                            });
                        }

                        const changes = dish.items;

                        // ---------- DELETE ----------
                        if (changes?.delete?.length) {
                            await tx.dishItem.deleteMany({
                                where: {
                                    id: { in: changes.delete.map(id => id.toString()) },
                                    dishId: dish.id?.toString(), // защита
                                },
                            });
                        }

                        // ---------- UPDATE ----------
                        if (changes?.update?.length) {
                            for (const item of changes.update) {
                                await tx.dishItem.update({
                                    where: { id: item.id?.toString() },
                                    data: {
                                        quantity: item.quantity,
                                        food: { connect: { id: item.foodId } }
                                    },
                                });
                            }
                        }

                        // ---------- CREATE ----------
                        if (changes?.create?.length) {
                            await tx.dishItem.createMany({
                                data: changes.create.map((item) => ({
                                    id: item.id,     // client-first id
                                    quantity: item.quantity,
                                    foodId: item.foodId,
                                    dishId: existingDish.id
                                })),
                                skipDuplicates: true, // важно для повторного sync
                            });
                        }

                        // =========================
                        // RETURN UPDATED DISH
                        // =========================

                        return await tx.dish.findUnique({
                            where: { id: dish.id },
                            include: {
                                items: true,
                            },
                        });
                    });

                    results.push({
                        id: dish.id,
                        dish: result,
                    });
                } catch (error) {
                    console.error("Dish sync error:", {
                        dishId: dish.id,
                        error,
                    });

                    notSync.push(dish.id)

                    results.push({
                        id: dish.id,
                        dish: null,
                    });
                }
            }

            return createResponseObject(200, "OK", {
                dishes: results,
                notSyncIds: notSync
            });
        })
    ,

} 