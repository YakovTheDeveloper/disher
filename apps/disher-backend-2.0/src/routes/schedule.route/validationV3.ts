import { z } from "zod";

const ItemContentZod = z.object({
    variant: z.enum(["custom", "food", "dish"]),
    customName: z.string().optional(),
    foodId: z.string().optional(),
    dishId: z.string().optional(),
}).superRefine((data, ctx) => {
    switch (data.variant) {
        case "custom":
            if (!data.customName) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "customName is required for variant 'custom'",
                    path: ["customName"],
                });
            }
            break;
        case "food":
            if (!data.foodId) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "foodId is required for variant 'food'",
                    path: ["foodId"],
                });
            }
            break;
        case "dish":
            if (!data.dishId) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "dishId is required for variant 'dish'",
                    path: ["dishId"],
                });
            }
            break;
    }
});


export const ScheduleItemCreateZod = z.object({
    id: z.string(),
    quantity: z.number(),
    content: ItemContentZod,
    time: z.string()
});

export const ScheduleItemUpdateZod = z.object({
    id: z.string(),
    quantity: z.number(),
    content: ItemContentZod,
    time: z.string()
});

export const ScheduleItemsChangesZod = z.object({
    create: z.array(ScheduleItemCreateZod).optional(),
    update: z.array(ScheduleItemUpdateZod).optional(),
    delete: z.array(z.string()).optional(),
});

export const ScheduleEventZod = z.object({
    id: z.string(),
    type: z.string(),
    value: z.string().optional(),
}).superRefine((data, ctx) => {

});

export const ScheduleEventsChangesZod = z.object({
    create: z.array(ScheduleEventZod).optional(),
    update: z.array(ScheduleEventZod).optional(),
    delete: z.array(z.string()).optional(),
});

export const ScheduleZod = z.object({
    id: z.string(),
    userId: z.number(),
    items: ScheduleItemsChangesZod,
    events: ScheduleEventsChangesZod
});

export const ScheduleSyncInputZod = z.object({
    schedules: z.array(ScheduleZod),
});

export type ScheduleSyncInput = z.infer<typeof ScheduleSyncInputZod>;
export type ScheduleItemsChangesZodInput = z.infer<typeof ScheduleItemsChangesZod>;
export type ScheduleZodType = z.infer<typeof ScheduleZod>;


