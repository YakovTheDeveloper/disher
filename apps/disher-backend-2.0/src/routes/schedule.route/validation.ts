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

// Final input schema
const DailyEventsInputSchema = z.object({
    items: z.array(DailyEventDataSchema),
});

// Type inference (optional)

export const DailyEventsUpdateSchema = z.object({
    id: z.number(),
    items: z.array(z.object({
        time: z.string(),
        content: DailyEventDataSchema
    })),
});

export type DailyEvents = z.infer<typeof DailyEventsUpdateSchema>;
