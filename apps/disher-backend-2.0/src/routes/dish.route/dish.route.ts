

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
    getDishes: t.procedure.query(async ({ input }) => {
        const result = await prisma.dish.findMany({
            select: dishSelect,
            where: { user: { id: 1 } }
        });

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