
import { DishZod } from "../dish.route/dish.validation.js";
import { z } from "zod";

// Base content types
export const DishItemContentZod = z.object({
    type: z.literal("dish"),
    dishId: z.string().transform((val) => val ? Number(val) : undefined),
});

export const CustomItemContentZod = z.object({
    type: z.literal("custom"),
    name: z.string().transform((val) => val ? Number(val) : undefined),
});

export const FoodItemContentZod = z.object({
    type: z.literal("food"),
    foodId: z.string().transform((val) => val ? Number(val) : undefined),
});

// Schedule item inputs for create/update
export const ScheduleItemCreateInputZod = z.object({
    quantity: z.number(),
    time: z.string(),
    content: z.union([FoodItemContentZod, DishItemContentZod, CustomItemContentZod]),
});

export const ScheduleItemUpdateInputZod = z.object({
    id: z.number(),
    quantity: z.number().optional(),
    time: z.string().optional(),
    content: z.union([FoodItemContentZod, DishItemContentZod, CustomItemContentZod]).optional(),
});

// Unified items input for nested Prisma operations
export const ScheduleItemsChangesZod = z.object({
    create: z.array(ScheduleItemCreateInputZod).optional(),
    update: z.array(ScheduleItemUpdateInputZod).optional(),
    delete: z.array(z.number()).optional(),
});

// DaySchedule schema with nested create/update/delete
export const DayScheduleZod = z.object({
    date: z.string(),
    userId: z.number(),
    dailyEvents: z.string().nullable().optional(),
    items: ScheduleItemsChangesZod, // <-- now supports nested operations
    isDraft: z.boolean(),
    lastTimeItemAdded: z.string().optional(),
    currentId: z.number().optional(),
    unsyncDishesPerSchedule: z.array(DishZod).optional()
});

// Universal sync input
export const ScheduleSyncInputZod = z.object({
    schedules: z.array(DayScheduleZod),
});

// TypeScript types
export type ScheduleSyncInput = z.infer<typeof ScheduleSyncInputZod>;
export type DayScheduleInput = z.infer<typeof DayScheduleZod>;
export type ScheduleItemsChangesInput = z.infer<typeof ScheduleItemsChangesZod>;
export type ScheduleItemCreateInput = z.infer<typeof ScheduleItemCreateInputZod>;
export type ScheduleItemUpdateInput = z.infer<typeof ScheduleItemUpdateInputZod>;
