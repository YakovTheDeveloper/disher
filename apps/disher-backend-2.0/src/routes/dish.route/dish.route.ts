

import z from "zod"
import { prisma } from "../../client"
import { t } from "../../trpc"
import { DishCreateWithoutUserInputSchema, DishItemCreateManyDishInputSchema, ScheduleCreateWithoutUserInputSchema, ScheduleItemCreateManyScheduleInputSchema } from "../../../prisma/generated/zod"
import { createResponseObject } from "../../lib/response"

const dishSelect = {
    id: true,
    name: true,
    items: {
        select: {
            food: {
                select: {
                    id: true,
                    name: true
                }
            }, id: true, quantity: true,
        }
    },
}

export const dihesRoutes = {
    getDishes: t.procedure
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
    getOneDish: t.procedure.input(
        z.object({
            id: z.number()
        })
    ).query(async ({ input }) => {
        const whereCondition = {
            id: input.id
        }

        const result = await prisma.dish.findFirst({
            select: dishSelect,
            where: whereCondition,

        });

        return createResponseObject(200, 'good', result)
    }),
    addDish: t.procedure
        .input(
            DishCreateWithoutUserInputSchema
        )
        .mutation(async ({ input }) => {
            const result = await prisma.dish.create({
                data: {
                    ...input,
                    userId: 1
                },
                select: dishSelect
            });
            return createResponseObject(200, 'good', result)
        }),
    updateDish: t.procedure
        .input(
            z.object({
                id: z.number(),
                name: z.string(),
                items: z.array(z.lazy(() => DishItemCreateManyDishInputSchema)).optional()
            })
        )
        .mutation(async ({ input }) => {
            const { id, items = null } = input;

            let itemsUpdate = {};
            let restUpdate: Partial<Pick<typeof input, 'name'>> = {}
            if (input.name) restUpdate.name = input.name

            if (items) {
                const existingItems = await prisma.dishItem.findMany({ where: { dishId: id } });

                const createItems = items.filter(i => !i.id);
                const updateItems = items.filter(i => i.id);
                const deleteIds = existingItems
                    .filter(e => !items.find(i => i.id === e.id))
                    .map(e => ({ id: e.id }));

                itemsUpdate = {
                    items: {
                        create: createItems,
                        update: updateItems.map(i => ({
                            where: { id: i.id },
                            data: { quantity: i.quantity }
                        })),
                        delete: deleteIds
                    }
                };
            }

            const result = await prisma.dish.update({
                where: { id },
                select: dishSelect,
                data: {
                    ...restUpdate,
                    ...itemsUpdate
                }
            });

            return createResponseObject(200, 'good', result);
        })
} 