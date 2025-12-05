// src/server/services/schedule.service.ts
import type { Prisma } from "@prisma/client";
import { scheduleItemSelect } from "./schedule.route";

export async function syncSchedule(
    tx: Prisma.TransactionClient,
    schedule: any // you can type with DayScheduleInput
) {
    const { date, dailyEvents, items, isDraft, userId } = schedule;

    const data: any = { userId };

    if (date) data.date = date;
    if (dailyEvents) data.dailyEvents = JSON.stringify(dailyEvents);

    // Transform nested items (create/update/delete)
    if (items) {
        data.items = {
            create: (items.create ?? []).map((u) => {
                const base = {
                    quantity: u.quantity,
                    time: u.time,
                    type: u.content.type,
                };

                switch (u.content.type) {
                    case "custom":
                        return {
                            ...base,
                            customFoodName: u.content.name,
                            dishId: null,
                            foodId: null,
                        };
                    case "dish":
                        return {
                            ...base,
                            dishId: u.content.dishId,
                            foodId: null,
                            customFoodName: null,
                        };
                    case "food":
                        return {
                            ...base,
                            foodId: u.content.foodId,
                            dishId: null,
                            customFoodName: null,
                        };
                }

                return base;
            }),

            update: (items.update ?? []).map((u) => {
                const updateData: any = {};
                if (u.quantity !== undefined) updateData.quantity = u.quantity;
                if (u.time !== undefined) updateData.time = u.time;

                if (u.content) {
                    switch (u.content.type) {
                        case "custom":
                            updateData.customFoodName = u.content.name;
                            updateData.dishId = null;
                            updateData.foodId = null;
                            break;
                        case "dish":
                            updateData.dishId = u.content.dishId;
                            updateData.foodId = null;
                            updateData.customFoodName = null;
                            break;
                        case "food":
                            updateData.foodId = u.content.foodId;
                            updateData.dishId = null;
                            updateData.customFoodName = null;
                            break;
                    }
                }

                return {
                    where: { id: u.id },
                    data: updateData,
                };
            }),

            delete: (items.delete ?? []).map((id) => ({ id })),
        };
    }

    // Create or update schedule
    if (isDraft) {
        console.log({
            ...data,
            items: { create: data.items?.create ?? [] },
        });
        return tx.schedule.create({
            data: {
                ...data,
                items: { create: data.items?.create ?? [] },
            },
            select: {
                id: true,
                date: true,
                dailyEvents: true,
                items: { select: scheduleItemSelect },
            },
        });
    }

    return tx.schedule.update({
        where: { date },
        data,
        select: {
            id: true,
            date: true,
            dailyEvents: true,
            items: { select: scheduleItemSelect },
        },
    });
}
