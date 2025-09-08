import { z } from "zod";

// Nutrient Schema
export const nutrientSchema = z.object({
    id: z.number().int().positive().optional(),
    name: z.string().min(1),
    value: z.number(),
    foodId: z.number().int().positive(),
});

// Food Schema
export const foodSchema = z.object({
    id: z.number().int().positive().optional(),
    name: z.string().min(1),
    nutrients: z.array(z.lazy(() => nutrientSchema)).optional(),
    ScheduleItem: z.array(z.any()).optional(), // will be replaced if needed
});

// Dish Schema
export const dishSchema = z.object({
    id: z.number().int().positive().optional(),
    productId: z.number().int().positive(),
    scheduleItemId: z.number().int().positive(),
    ScheduleItem: z.array(z.any()).optional(), // relation handled later
});

// ScheduleItem Schema
export const scheduleItemSchema = z.object({
    id: z.number().int().positive().optional(),
    quantity: z.number().int().positive(),
    createdAt: z.date().optional(),
    foodId: z.number().int().positive().nullable().optional(),
    dishId: z.number().int().positive().nullable().optional(),
    scheduleId: z.number().int().positive(),
    food: z.lazy(() => foodSchema).optional(),
    dish: z.lazy(() => dishSchema).optional(),
});

// Schedule Schema
export const scheduleSchema = z.object({
    id: z.number().int().positive().optional(),
    name: z.string().min(1),
    date: z.string(), // or z.string().regex(/^\d{4}-\d{2}-\d{2}$/) for YYYY-MM-DD
    items: z.array(z.lazy(() => scheduleItemSchema)).optional(),
    createdAt: z.date().optional(),
    userId: z.number().int().positive(),
    user: z.any().optional(), // Replace with actual User schema if needed
});

export const addScheduleSchema = z.object({
    name: z.string().min(1),
    date: z.string(), // or z.string().regex(/^\d{4}-\d{2}-\d{2}$/) for YYYY-MM-DD
    items: z.array(z.lazy(() => scheduleItemSchema)).optional(),
    createdAt: z.date().optional(),
    userId: z.number().int().positive(),
    user: z.any().optional(), // Replace with actual User schema if needed
});
