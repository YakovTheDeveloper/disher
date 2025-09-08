

import z from "zod"
import { prisma } from "../client"
import { t } from "../trpc"
import { ScheduleCreateInputSchema, ScheduleCreateWithoutUserInputSchema, ScheduleItemCreateManyFoodInputSchema, ScheduleItemCreateManyScheduleInputSchema, ScheduleItemCreateNestedManyWithoutScheduleInputSchema, ScheduleItemCreateWithoutScheduleInputSchema, ScheduleItemUncheckedUpdateWithoutScheduleInputSchema, ScheduleItemUpdateWithoutScheduleInputSchema, ScheduleUpdateInputSchema, ScheduleUpdateWithoutUserInputSchema, ScheduleWhereUniqueInputSchema } from "../../prisma/generated/zod"
import { createResponseObject } from "../lib/response"

const scheduleItemSelect = {
    dishId: true, foodId: true, foodName: true, id: true, quantity: true,
    time: true
}

export const scheduleRoutes = {
    getSchedules: t.procedure.input(
        z.object({
            date: z.iso.datetime().optional(),
        })
    ).query(async ({ input }) => {
        const parsedDate = input.date ? new Date(input.date) : null;

        const whereCondition = parsedDate
            ? {
                date: {
                    gte: new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1), // start of month
                    lt: new Date(parsedDate.getFullYear(), parsedDate.getMonth() + 1, 1), // next month
                },
            }
            : undefined;

        const result = await prisma.schedule.findMany({
            select: {
                id: true,
                date: true,
                items: {
                    select: scheduleItemSelect
                },
            },
            where: whereCondition
        });

        return createResponseObject(200, 'good', result)
    }),
    getOneSchedule: t.procedure.input(
        z.object({
            id: z.number()
        })
    ).query(async ({ input }) => {
        const whereCondition = {
            id: input.id
        }

        const result = await prisma.schedule.findFirst({
            select: {
                id: true,
                date: true,
                items: {
                    select: scheduleItemSelect
                },
            },
            where: whereCondition
        });

        return createResponseObject(200, 'good', result)
    }),
    addSchedule: t.procedure
        .input(
            ScheduleCreateWithoutUserInputSchema
        )
        .mutation(async ({ input }) => {
            const result = await prisma.schedule.create({
                data: {
                    ...input,
                    userId: 1
                }, select: {
                    id: true, items: {
                        select: scheduleItemSelect
                    }, date: true
                }
            });
            return createResponseObject(200, 'good', result)
        }),
    updateSchedule: t.procedure
        .input(
            z.object({
                id: z.number(),
                date: z.iso.datetime().optional(),
                items: z.array(z.lazy(() => ScheduleItemCreateManyScheduleInputSchema)).optional()
            })
        )
        .mutation(async ({ input }) => {
            const { id, items = null } = input;

            // Fetch existing items only if items are provided
            let itemsUpdate = {};
            let restUpdate: Pick<typeof input, 'date'> = {}
            if (input.date) restUpdate.date = input.date

            if (items) {
                const existingItems = await prisma.scheduleItem.findMany({ where: { scheduleId: id } });

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
                            data: { quantity: i.quantity, time: i.time }
                        })),
                        delete: deleteIds
                    }
                };
            }

            const result = await prisma.schedule.update({
                where: { id },
                select: {
                    date: true,
                    id: true,
                    items: {
                        select: scheduleItemSelect
                    },
                },
                data: {
                    ...restUpdate,
                    ...itemsUpdate
                }
            });

            return createResponseObject(200, 'good', result);
        })
} 