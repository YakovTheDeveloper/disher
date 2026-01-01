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
    type?: "food";
    time?: string;
    quantity?: number;
    customFoodName?: string;
    foodId?: number;
}, {
    dishId: never;
    type?: "food";
    time?: string;
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
    type?: "dish";
    time?: string;
    quantity?: number;
    customFoodName?: string;
    dishId?: number;
}, {
    foodId: never;
    type?: "dish";
    time?: string;
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
    type?: "custom";
    time?: string;
    quantity?: number;
    customFoodName?: string;
}, {
    foodId: never;
    dishId: never;
    type?: "custom";
    time?: string;
    quantity?: number;
    customFoodName?: string;
}>]>;
//# sourceMappingURL=scheduleItem.validation.d.ts.map