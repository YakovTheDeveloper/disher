"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleSyncInputZod = exports.ScheduleZod = exports.ScheduleEventsChangesZod = exports.ScheduleEventZod = exports.ScheduleItemsChangesZod = exports.ScheduleItemUpdateZod = exports.ScheduleItemCreateZod = void 0;
var zod_1 = require("zod");
var ItemContentZod = zod_1.z.object({
    variant: zod_1.z.enum(["custom", "food", "dish"]),
    customName: zod_1.z.string().optional(),
    foodId: zod_1.z.string().optional(),
    dishId: zod_1.z.string().optional(),
}).superRefine(function (data, ctx) {
    switch (data.variant) {
        case "custom":
            if (!data.customName) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: "customName is required for variant 'custom'",
                    path: ["customName"],
                });
            }
            break;
        case "food":
            if (!data.foodId) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: "foodId is required for variant 'food'",
                    path: ["foodId"],
                });
            }
            break;
        case "dish":
            if (!data.dishId) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: "dishId is required for variant 'dish'",
                    path: ["dishId"],
                });
            }
            break;
    }
});
exports.ScheduleItemCreateZod = zod_1.z.object({
    id: zod_1.z.string(),
    quantity: zod_1.z.number(),
    content: ItemContentZod,
    time: zod_1.z.string()
});
exports.ScheduleItemUpdateZod = zod_1.z.object({
    id: zod_1.z.string(),
    quantity: zod_1.z.number(),
    content: ItemContentZod,
    time: zod_1.z.string()
});
exports.ScheduleItemsChangesZod = zod_1.z.object({
    create: zod_1.z.array(exports.ScheduleItemCreateZod).optional(),
    update: zod_1.z.array(exports.ScheduleItemUpdateZod).optional(),
    delete: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.ScheduleEventZod = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.string(),
    value: zod_1.z.string().optional(),
}).superRefine(function (data, ctx) {
});
exports.ScheduleEventsChangesZod = zod_1.z.object({
    create: zod_1.z.array(exports.ScheduleEventZod).optional(),
    update: zod_1.z.array(exports.ScheduleEventZod).optional(),
    delete: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.ScheduleZod = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.number(),
    items: exports.ScheduleItemsChangesZod,
    events: exports.ScheduleEventsChangesZod
});
exports.ScheduleSyncInputZod = zod_1.z.object({
    schedules: zod_1.z.array(exports.ScheduleZod),
});
