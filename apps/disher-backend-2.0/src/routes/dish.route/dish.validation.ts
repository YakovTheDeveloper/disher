import { z } from "zod";

export const DishItemCreateZod = z.object({
    quantity: z.number(),
    foodId: z.string().transform((val) => val ? Number(val) : undefined),
});

export const DishItemUpdateZod = z.object({
    id: z.string().transform((val) => val ? Number(val) : undefined),
    quantity: z.number().optional(),
    foodId: z.string().optional().transform((val) => val ? Number(val) : undefined),
});

export const DishItemsChangesZod = z.object({
    create: z.array(DishItemCreateZod).optional(),
    update: z.array(DishItemUpdateZod).optional(),
    delete: z.array(z.number()).optional(),
});

export const DishZod = z.object({
    id: z.string().optional().transform((val) => val ? Number(val) : undefined), // null → create, exists → update
    name: z.string(),
    userId: z.number(),
    isDraft: z.boolean(),
    items: DishItemsChangesZod,
});

export const DishSyncInputZod = z.object({
    dishes: z.array(DishZod),
});

export type DishSyncInput = z.infer<typeof DishSyncInputZod>;
export type DishItemsChangesZodInput = z.infer<typeof DishItemsChangesZod>;
export type DishZodType = z.infer<typeof DishZod>;
