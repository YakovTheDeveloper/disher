import { z } from "zod";

// FoodContentProduct snapshot structure (from frontend FoodContentProduct model)
const FoodContentProductSnapshotSchema = z.object({
    foodId: z.string(),
    variant: z.literal("product"),
    quantity: z.number(),
});

// FoodContentDish snapshot structure (from frontend FoodContentDish model)
const FoodContentDishSnapshotSchema = z.object({
    dishId: z.string(),
    variant: z.literal("dish"),
    quantity: z.number(),
});

// ScheduleFoodsItem snapshot structure (from frontend ScheduleFoodsItem model)
const ScheduleFoodsItemSnapshotSchema = z.object({
    id: z.string(),
    time: z.string(),
    contentProduct: FoodContentProductSnapshotSchema.nullable(),
    contentDish: FoodContentDishSnapshotSchema.nullable(),
});

// ScheduleFoods snapshot structure (from frontend ScheduleFoods model)
export const ScheduleFoodsSnapshotSchema = z.object({
    id: z.string(),
    foods: z.array(ScheduleFoodsItemSnapshotSchema),
});

// Type inference from schema
export type ScheduleFoodsSnapshot = z.infer<typeof ScheduleFoodsSnapshotSchema>;
export type ScheduleFoodsItemSnapshot = z.infer<typeof ScheduleFoodsItemSnapshotSchema>;
export type FoodContentProductSnapshot = z.infer<typeof FoodContentProductSnapshotSchema>;
export type FoodContentDishSnapshot = z.infer<typeof FoodContentDishSnapshotSchema>;

// Input validation for the analytics route
export const AnalyzeScheduleInputSchema = ScheduleFoodsSnapshotSchema;

export type AnalyzeScheduleInput = z.infer<typeof AnalyzeScheduleInputSchema>;
