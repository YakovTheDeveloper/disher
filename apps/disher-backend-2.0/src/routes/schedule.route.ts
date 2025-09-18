

import z from "zod"
import { prisma } from "../client"
import { t } from "../trpc"
import { ScheduleCreateInputSchema, ScheduleCreateWithoutUserInputSchema, ScheduleItemCreateManyFoodInputSchema, ScheduleItemCreateManyScheduleInputSchema, ScheduleItemCreateNestedManyWithoutScheduleInputSchema, ScheduleItemCreateWithoutScheduleInputSchema, ScheduleItemUncheckedUpdateWithoutScheduleInputSchema, ScheduleItemUpdateWithoutScheduleInputSchema, ScheduleUpdateInputSchema, ScheduleUpdateWithoutUserInputSchema, ScheduleWhereUniqueInputSchema } from "../../prisma/generated/zod"
import { createResponseObject } from "../lib/response"
import { DailySurveySchema } from "./schedule.route/validation"
import { Prisma } from "@prisma/client"

const scheduleItemSelect = {
    dish: {
        select: {
            id: true,
            name: true,
            items: {
                select: {
                    quantity: true,
                    food: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                }
            }
        }
    },
    food: {
        select: {
            id: true,
            name: true,
        }
    },
    customFoodName: true,
    id: true,
    quantity: true,
    time: true

}
export const scheduleRoutes = {
    getSchedules: t.procedure.input(
        z.object({
            date: z.string().datetime().optional(),
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
                questionnaire: true,
                items: {
                    select: scheduleItemSelect
                },
            },
            where: whereCondition
        });

        return createResponseObject(200, 'good', result)
    }),
    getOneSchedule: t.procedure.input(
        z.union([
            z.object({ id: z.number(), date: z.string().datetime().optional() }),
            z.object({ id: z.number().optional(), date: z.string().datetime() }),
        ])
    ).query(async ({ input }) => {
        const whereCondition = {
            id: input.id,
            ...(input.date ? { date: input.date } : {})
        }

        try {
            const result = await prisma.schedule.findFirst({
                select: {
                    id: true,
                    questionnaire: true,
                    date: true,
                    items: {
                        select: scheduleItemSelect
                    },
                },
                where: whereCondition
            });

            if (!result) {
                return createResponseObject(404, "Schedule not found", null);
            }

            return createResponseObject(200, "OK", result);

        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                return createResponseObject(400, "Database error", null);
            }
            return createResponseObject(500, "Unexpected error", null);
        }
    }),
    addSchedule: t.procedure
        .input(
            ScheduleCreateWithoutUserInputSchema
        )
        .mutation(async ({ input }) => {


            try {
                const result = await prisma.schedule.create({
                    data: {
                        ...input,
                        userId: 1
                    }, select: {
                        id: true,
                        items: {
                            select: scheduleItemSelect
                        },
                        date: true,
                        questionnaire: true,
                    }
                });

                if (!result) {
                    return createResponseObject(404, "hz", null);
                }

                return createResponseObject(200, "OK", result);

            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    return createResponseObject(400, "Database error", null);
                }
                return createResponseObject(500, "Unexpected error", null);
            }

        }),
    updateSchedule: t.procedure
        .input(
            z.object({
                id: z.number(),
                date: z.string().optional(),
                items: z.array(z.lazy(() => ScheduleItemCreateManyScheduleInputSchema)).optional(),
                questionnaire: DailySurveySchema.optional()
            })
        )
        .mutation(async ({ input }) => {
            const { id, items = null } = input;

            // Fetch existing items only if items are provided
            let itemsUpdate = {};
            let restUpdate: Partial<{
                date: string,
                questionnaire: string
            }> = {}
            if (input.date) restUpdate.date = input.date
            if (input.questionnaire) restUpdate.questionnaire = JSON.stringify(input.questionnaire)

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


            try {
                const result = await prisma.schedule.update({
                    where: { id },
                    select: {
                        date: true,
                        id: true,
                        questionnaire: true,
                        items: {
                            select: scheduleItemSelect
                        },
                    },
                    data: {
                        ...restUpdate,
                        ...itemsUpdate
                    }
                });

                if (!result) {
                    return createResponseObject(404, "hz", null);
                }

                return createResponseObject(200, "OK", result);

            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    return createResponseObject(400, "Database error", null);
                }
                return createResponseObject(500, "Unexpected error", null);
            }

        })
} 