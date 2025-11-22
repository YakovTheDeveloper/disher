import { z } from "zod";

const FoodScheduleItemCreateZod = z.object({
    type: z.literal("food"),
    quantity: z.number(),
    time: z.string(),
    foodId: z.number(),
    customFoodName: z.string().nullable().optional(), // backend ignores it
    dishId: z.never().optional(),
});

const DishScheduleItemCreateZod = z.object({
    type: z.literal("dish"),
    quantity: z.number(),
    time: z.string(),
    dishId: z.number(),
    customFoodName: z.string().nullable().optional(),
    foodId: z.never().optional(),
});


const CustomScheduleItemCreateZod = z.object({
    type: z.literal("custom"),
    quantity: z.number(),
    time: z.string(),
    customFoodName: z.string(),
    foodId: z.never().optional(),
    dishId: z.never().optional(),
});

export const ScheduleItemCreateZod = z.discriminatedUnion("type", [
    FoodScheduleItemCreateZod,
    DishScheduleItemCreateZod,
    CustomScheduleItemCreateZod,
]);

