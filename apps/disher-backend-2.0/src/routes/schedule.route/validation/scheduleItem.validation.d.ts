import { z } from "zod";
export declare const ScheduleItemCreateZod: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"food">;
    quantity: z.ZodNumber;
    time: z.ZodString;
    foodId: z.ZodNumber;
    customFoodName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    dishId: z.ZodOptional<z.ZodNever>;
}, "strip", z.ZodTypeAny, {
    dishId: never;
    time?: string;
    type?: "food";
    quantity?: number;
    customFoodName?: string;
    foodId?: number;
}, {
    dishId: never;
    time?: string;
    type?: "food";
    quantity?: number;
    customFoodName?: string;
    foodId?: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"dish">;
    quantity: z.ZodNumber;
    time: z.ZodString;
    dishId: z.ZodNumber;
    customFoodName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    foodId: z.ZodOptional<z.ZodNever>;
}, "strip", z.ZodTypeAny, {
    foodId: never;
    time?: string;
    type?: "dish";
    quantity?: number;
    customFoodName?: string;
    dishId?: number;
}, {
    foodId: never;
    time?: string;
    type?: "dish";
    quantity?: number;
    customFoodName?: string;
    dishId?: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"custom">;
    quantity: z.ZodNumber;
    time: z.ZodString;
    customFoodName: z.ZodString;
    foodId: z.ZodOptional<z.ZodNever>;
    dishId: z.ZodOptional<z.ZodNever>;
}, "strip", z.ZodTypeAny, {
    foodId: never;
    dishId: never;
    time?: string;
    type?: "custom";
    quantity?: number;
    customFoodName?: string;
}, {
    foodId: never;
    dishId: never;
    time?: string;
    type?: "custom";
    quantity?: number;
    customFoodName?: string;
}>]>;
//# sourceMappingURL=scheduleItem.validation.d.ts.map