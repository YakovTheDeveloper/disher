"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DishSyncInputZod = exports.DishZod = exports.DishItemsChangesZod = exports.DishItemUpdateZod = exports.DishItemCreateZod = void 0;
var zod_1 = require("zod");
exports.DishItemCreateZod = zod_1.z.object({
    id: zod_1.z.string(),
    quantity: zod_1.z.number(),
    foodId: zod_1.z.string().transform(function (val) { return Number(val); }),
});
exports.DishItemUpdateZod = zod_1.z.object({
    id: zod_1.z.string(),
    quantity: zod_1.z.number().optional(),
    foodId: zod_1.z.string().optional().transform(function (val) { return val ? Number(val) : undefined; }),
});
exports.DishItemsChangesZod = zod_1.z.object({
    create: zod_1.z.array(exports.DishItemCreateZod).optional(),
    update: zod_1.z.array(exports.DishItemUpdateZod).optional(),
    delete: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.DishZod = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    userId: zod_1.z.number(),
    items: exports.DishItemsChangesZod,
});
exports.DishSyncInputZod = zod_1.z.object({
    dishes: zod_1.z.array(exports.DishZod),
});
