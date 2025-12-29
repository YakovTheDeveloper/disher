

import z from "zod"
import { prisma } from "../../client"
import { publicProcedure, t } from "../../trpc"
import { ScheduleCreateInputSchema, ScheduleCreateWithoutUserInputSchema, ScheduleItemCreateInputSchema, ScheduleItemCreateManyFoodInputSchema, ScheduleItemCreateManyScheduleInputSchema, ScheduleItemCreateNestedManyWithoutScheduleInputSchema, ScheduleItemCreateWithoutScheduleInputSchema, ScheduleItemUncheckedCreateInputSchema, ScheduleItemUncheckedUpdateWithoutScheduleInputSchema, ScheduleItemUpdateInputSchema, ScheduleItemUpdateWithoutScheduleInputSchema, ScheduleUpdateInputSchema, ScheduleUpdateWithoutUserInputSchema, ScheduleWhereUniqueInputSchema } from "../../../prisma/generated/zod"
import { createResponseObject } from "../../lib/response"
import { DailyEventsUpdateSchema, ScheduleCreateInputZod, ScheduleUpdateInputZod } from "./validation"
import { Prisma } from "@prisma/client"
import { ScheduleSyncInputZod } from "./validationV3"
import { mapScheduleItemData, syncSchedule } from "./schedule.service"

export const scheduleItemSelect = {
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
    getSchedules: publicProcedure.input(
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
                dailyEvents: true,
                items: {
                    select: scheduleItemSelect
                },
            },
            where: whereCondition
        });

        return createResponseObject(200, 'good', result)
    }),
    getOneSchedule: publicProcedure.input(
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
                    dailyEvents: true,
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
    addSchedule: publicProcedure
        .input(
            ScheduleCreateInputZod
        )
        .mutation(async ({ input }) => {

            const { dailyEvents = null, date, items = [] } = input

            try {
                const result = await prisma.schedule.create({
                    data: {
                        date,
                        items: items ? { create: items } : undefined,
                        userId: 1,
                        dailyEvents: dailyEvents ? JSON.stringify(dailyEvents) : null
                    }, select: {
                        id: true,
                        items: {
                            select: scheduleItemSelect
                        },
                        date: true,
                        dailyEvents: true,
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
    updateScheduleDailyEvents: publicProcedure.input(DailyEventsUpdateSchema).mutation(async ({ input }) => {
        const { id, items } = input
        try {
            const result = await prisma.schedule.update({
                where: { id },
                select: {
                    date: true,
                    id: true,
                    dailyEvents: true,
                },
                data: {
                    dailyEvents: JSON.stringify(items)
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
    updateSchedule: publicProcedure
        .input(ScheduleUpdateInputZod)
        .mutation(async ({ input }) => {
            const { id, date, changes } = input;

            const data: any = {};
            if (date) data.date = date;

            if (changes) {
                data.items = {
                    create: changes.create ?? [],
                    update: (changes.update ?? []).map((u) => {
                        const updateData: any = {};

                        if (u.quantity !== undefined) updateData.quantity = u.quantity;
                        if (u.time !== undefined) updateData.time = u.time;

                        // If customFoodName is provided
                        if (u.customFoodName !== undefined) {
                            updateData.customFoodName = u.customFoodName;

                            // Unlink dish and product if custom name is set
                            updateData.dishId = null;
                            updateData.foodId = null;
                        } else {
                            // Otherwise update them normally if explicitly provided
                            if (u.dishId !== undefined) updateData.dishId = u.dishId;
                            if (u.foodId !== undefined) updateData.foodId = u.foodId;
                        }

                        return {
                            where: { id: u.id },
                            data: updateData,
                        };
                    }),
                    delete: (changes.delete ?? []).map((id) => ({ id })),
                };
            }

            if (input.dailyEvents) {
                data.dailyEvents = JSON.stringify(input.dailyEvents)
            }


            try {
                const result = await prisma.schedule.update({
                    where: { id },
                    data,
                    select: {
                        id: true,
                        date: true,
                        dailyEvents: true,
                        items: { select: scheduleItemSelect },
                    },
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


    syncSchedule: publicProcedure
        .input(ScheduleSyncInputZod)
        .mutation(async ({ input }) => {
            const results = [];

            for (const schedule of input.schedules) {

                try {
                    const result = await prisma.$transaction(async (tx) => {
                        // =========================
                        // UPSERT SCHEDULE
                        // =========================
                        let existingSchedule = await tx.schedule.findUnique({
                            where: { id: schedule.id },
                        });

                        if (existingSchedule) {
                            await tx.schedule.update({
                                where: { id: schedule.id },
                                data: {
                                    updatedAt: new Date(),
                                },
                            });
                        } else {
                            existingSchedule = await tx.schedule.create({
                                data: {
                                    id: schedule.id, // client-first id
                                    userId: schedule.userId,
                                },
                            });
                        }

                        const changes = schedule.items;
                        const eventChanges = schedule.events;

                        if (eventChanges?.delete?.length) {
                            await tx.scheduleEvent.deleteMany({
                                where: {
                                    id: { in: eventChanges.delete },
                                    scheduleId: schedule.id,
                                },
                            });
                        }
                        if (eventChanges?.update?.length) {
                            for (const item of eventChanges.update) {
                                await tx.scheduleEvent.update({
                                    where: { id: item.id },
                                    data: {
                                        time: item.time,
                                        
                                    },
                                });
                            }
                        }
                        if (eventChanges?.create?.length) {
                            await tx.scheduleEvent.createMany({
                                data: eventChanges.create.map((item) => ({
                                    id: item.id,
                                    scheduleId: schedule.id,
                                    time: item.time,

                                })),
                                skipDuplicates: true,
                            });
                        }

                        if (changes?.delete?.length) {
                            await tx.scheduleItem.deleteMany({
                                where: {
                                    id: { in: changes.delete },
                                    scheduleId: schedule.id,
                                },
                            });
                        }
                        if (changes?.update?.length) {
                            for (const item of changes.update) {
                                await tx.scheduleItem.update({
                                    where: { id: item.id },
                                    data: {
                                        time: item.time,
                                        ...mapScheduleItemData(item),
                                    },
                                });
                            }
                        }
                        if (changes?.create?.length) {
                            await tx.scheduleItem.createMany({
                                data: changes.create.map((item) => ({
                                    id: item.id,
                                    scheduleId: schedule.id,
                                    time: item.time,
                                    ...mapScheduleItemData(item),
                                })),
                                skipDuplicates: true,
                            });
                        }
                        return tx.schedule.findUnique({
                            where: { id: schedule.id },
                            include: {
                                items: true,
                            },
                        });
                    });

                    results.push({
                        id: schedule.id,
                        schedule: result,
                    });
                } catch (error) {
                    console.error("Schedule sync error:", {
                        scheduleId: schedule.id,
                        error,
                    });

                    results.push({
                        id: schedule.id,
                        schedule: null,
                    });
                }
            }

            return createResponseObject(200, "OK", results);
        })




} 