import { z } from "zod";

// Helper schema for OneToTen
const OneToTenSchema = z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
    z.literal(8),
    z.literal(9),
    z.literal(10),
]);

// Individual event schemas
const SleepEventSchema = z.object({
    variant: z.literal("sleep"),
    content: z.object({
        quality: OneToTenSchema,
        hours: z.number().nonnegative(),
        minutes: z.number().min(0).max(59),
    }),
});

const MoodEventSchema = z.object({
    variant: z.literal("mood"),
    content: z.object({
        value: OneToTenSchema,
    }),
});

const EnergyEventSchema = z.object({
    variant: z.literal("energy"),
    content: z.object({
        value: OneToTenSchema,
    }),
});

const DigestionEventSchema = z.object({
    variant: z.literal("digestion"),
    content: z.object({
        variant: z.enum([
            "bloating",
            "stomach_pain",
            "heartburn",
            "constipation",
            "diarrhea",
        ]),
        value: OneToTenSchema,
    }),
});

const ActivityEventSchema = z.object({
    variant: z.literal("activity"),
    content: z.object({
        variant: z.string(),
        hours: z.number().nonnegative(),
        minutes: z.number().min(0).max(59),
    }),
});

const NoteEventSchema = z.object({
    variant: z.literal("note"),
    content: z.object({
        value: z.string().min(1),
    }),
});

// Union of all event types
const DailyEventDataSchema = z.union([
    SleepEventSchema,
    MoodEventSchema,
    EnergyEventSchema,
    DigestionEventSchema,
    ActivityEventSchema,
    NoteEventSchema,
]);


// Type inference (optional)

const DailyEventsItemsSchema = z.object({
    time: z.string(),
    content: DailyEventDataSchema
})

const DailyEventsInputSchema = z.array(DailyEventsItemsSchema)

export const DailyEventsUpdateSchema = z.object({
    id: z.number(),
    items: DailyEventsInputSchema
});

export type DailyEvents = z.infer<typeof DailyEventsUpdateSchema>;

export type DailyEventEntity = z.infer<typeof DailyEventsItemsSchema>;



export const ScheduleItemCreateZod = z.object({
    quantity: z.number(),
    time: z.string(),
    customFoodName: z.string().optional().nullable(),
    foodId: z.number().optional(),
    dishId: z.number().optional(),
});

export const ScheduleItemUpdateZod = z.object({
    id: z.number(),
    quantity: z.number().optional(),
    time: z.string().optional(),
    customFoodName: z.string().optional().nullable(),
    foodId: z.number().optional().nullable(),
    dishId: z.number().optional().nullable(),
});

export const ScheduleChangesZod = z.object({
    create: z.array(ScheduleItemCreateZod).optional(),
    update: z.array(ScheduleItemUpdateZod).optional(),
    delete: z.array(z.number()).optional(),
});

export const ScheduleUpdateInputZod = z.object({
    id: z.number(),
    date: z.string().optional(),
    dailyEvents: DailyEventsInputSchema.optional(),
    changes: ScheduleChangesZod.optional(),
});


export const ScheduleCreateInputZod = z.object({
    date: z.string(),
    dailyEvents: DailyEventsInputSchema,
    items: z.array(ScheduleItemCreateZod).optional(),
});