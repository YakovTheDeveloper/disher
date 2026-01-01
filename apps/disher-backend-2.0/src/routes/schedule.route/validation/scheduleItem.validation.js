"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleItemCreateZod = void 0;
var zod_1 = require("zod");
var FoodScheduleItemCreateZod = zod_1.z.object({
    type: zod_1.z.literal("food"),
    quantity: zod_1.z.number(),
    time: zod_1.z.string(),
    foodId: zod_1.z.number(),
    customFoodName: zod_1.z.string().nullable().optional(), // backend ignores it
    dishId: zod_1.z.never().optional(),
});
var DishScheduleItemCreateZod = zod_1.z.object({
    type: zod_1.z.literal("dish"),
    quantity: zod_1.z.number(),
    time: zod_1.z.string(),
    dishId: zod_1.z.number(),
    customFoodName: zod_1.z.string().nullable().optional(),
    foodId: zod_1.z.never().optional(),
});
var CustomScheduleItemCreateZod = zod_1.z.object({
    type: zod_1.z.literal("custom"),
    quantity: zod_1.z.number(),
    time: zod_1.z.string(),
    customFoodName: zod_1.z.string(),
    foodId: zod_1.z.never().optional(),
    dishId: zod_1.z.never().optional(),
});
exports.ScheduleItemCreateZod = zod_1.z.discriminatedUnion("type", [
    FoodScheduleItemCreateZod,
    DishScheduleItemCreateZod,
    CustomScheduleItemCreateZod,
]);
