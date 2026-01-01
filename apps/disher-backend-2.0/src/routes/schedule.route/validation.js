"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleCreateInputZod = exports.ScheduleUpdateInputZod = exports.ScheduleChangesZod = exports.ScheduleItemUpdateZod = exports.DailyEventsUpdateSchema = void 0;
var zod_1 = require("zod");
var scheduleItem_validation_1 = require("./validation/scheduleItem.validation");
// Helper schema for OneToTen
var OneToTenSchema = zod_1.z.union([
    zod_1.z.literal(1),
    zod_1.z.literal(2),
    zod_1.z.literal(3),
    zod_1.z.literal(4),
    zod_1.z.literal(5),
    zod_1.z.literal(6),
    zod_1.z.literal(7),
    zod_1.z.literal(8),
    zod_1.z.literal(9),
    zod_1.z.literal(10),
]);
// Individual event schemas
var SleepEventSchema = zod_1.z.object({
    variant: zod_1.z.literal("sleep"),
    content: zod_1.z.object({
        quality: OneToTenSchema,
        hours: zod_1.z.number().nonnegative(),
        minutes: zod_1.z.number().min(0).max(59),
    }),
});
var MoodEventSchema = zod_1.z.object({
    variant: zod_1.z.literal("mood"),
    content: zod_1.z.object({
        value: OneToTenSchema,
    }),
});
var EnergyEventSchema = zod_1.z.object({
    variant: zod_1.z.literal("energy"),
    content: zod_1.z.object({
        value: OneToTenSchema,
    }),
});
var DigestionEventSchema = zod_1.z.object({
    variant: zod_1.z.literal("digestion"),
    content: zod_1.z.object({
        variant: zod_1.z.enum([
            "bloating",
            "stomach_pain",
            "heartburn",
            "constipation",
            "diarrhea",
        ]),
        value: OneToTenSchema,
    }),
});
var ActivityEventSchema = zod_1.z.object({
    variant: zod_1.z.literal("activity"),
    content: zod_1.z.object({
        variant: zod_1.z.string(),
        hours: zod_1.z.number().nonnegative(),
        minutes: zod_1.z.number().min(0).max(59),
    }),
});
var NoteEventSchema = zod_1.z.object({
    variant: zod_1.z.literal("note"),
    content: zod_1.z.object({
        value: zod_1.z.string().min(1),
    }),
});
// Union of all event types
var DailyEventDataSchema = zod_1.z.union([
    SleepEventSchema,
    MoodEventSchema,
    EnergyEventSchema,
    DigestionEventSchema,
    ActivityEventSchema,
    NoteEventSchema,
]);
// Type inference (optional)
var DailyEventsItemsSchema = zod_1.z.object({
    time: zod_1.z.string(),
    content: DailyEventDataSchema
});
var DailyEventsInputSchema = zod_1.z.array(DailyEventsItemsSchema);
exports.DailyEventsUpdateSchema = zod_1.z.object({
    id: zod_1.z.number(),
    items: DailyEventsInputSchema
});
exports.ScheduleItemUpdateZod = zod_1.z.object({
    id: zod_1.z.number(),
    quantity: zod_1.z.number().optional(),
    time: zod_1.z.string().optional(),
    customFoodName: zod_1.z.string().optional().nullable(),
    foodId: zod_1.z.number().optional().nullable(),
    dishId: zod_1.z.number().optional().nullable(),
});
exports.ScheduleChangesZod = zod_1.z.object({
    create: zod_1.z.array(scheduleItem_validation_1.ScheduleItemCreateZod).optional(),
    update: zod_1.z.array(exports.ScheduleItemUpdateZod).optional(),
    delete: zod_1.z.array(zod_1.z.number()).optional(),
});
exports.ScheduleUpdateInputZod = zod_1.z.object({
    id: zod_1.z.number(),
    date: zod_1.z.string().optional(),
    dailyEvents: DailyEventsInputSchema.optional(),
    changes: exports.ScheduleChangesZod.optional(),
});
exports.ScheduleCreateInputZod = zod_1.z.object({
    date: zod_1.z.string(),
    dailyEvents: DailyEventsInputSchema,
    items: zod_1.z.array(scheduleItem_validation_1.ScheduleItemCreateZod).optional(),
});
