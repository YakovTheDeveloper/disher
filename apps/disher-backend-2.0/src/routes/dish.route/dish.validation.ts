import { z } from "zod";

export const DishItemCreateZod = z.object({
    id: z.string(),
    quantity: z.number(),
    foodId: z.string().transform((val) => Number(val)),
});

export const DishItemUpdateZod = z.object({
    id: z.string(),
    quantity: z.number().optional(),
    foodId: z.string().optional().transform((val) => val ? Number(val) : undefined),
});

export const DishItemsChangesZod = z.object({
    create: z.array(DishItemCreateZod).optional(),
    update: z.array(DishItemUpdateZod).optional(),
    delete: z.array(z.string()).optional(),
});

export const DishZod = z.object({
    id: z.string(),
    name: z.string(),
    userId: z.number(),
    items: DishItemsChangesZod,
});

export const DishSyncInputZod = z.object({
    dishes: z.array(DishZod),
});

export type DishSyncInput = z.infer<typeof DishSyncInputZod>;
export type DishItemsChangesZodInput = z.infer<typeof DishItemsChangesZod>;
export type DishZodType = z.infer<typeof DishZod>;
