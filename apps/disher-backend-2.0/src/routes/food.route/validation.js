"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddFoodInputSchema = exports.FoodNutrientInputSchema = void 0;
var zod_1 = require("zod");
exports.FoodNutrientInputSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive(), // nutrient id
    value: zod_1.z.number().nonnegative(), // quantity
});
exports.AddFoodInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    nameEng: zod_1.z.string().min(1, "Name is required"),
    description: zod_1.z.string().optional(),
    descriptionEng: zod_1.z.string().optional(),
    nutrients: zod_1.z.array(exports.FoodNutrientInputSchema).default([]),
});
