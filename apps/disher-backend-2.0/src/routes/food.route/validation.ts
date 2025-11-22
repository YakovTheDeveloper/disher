import { z } from "zod";

export const FoodNutrientInputSchema = z.object({
    id: z.number().int().positive(), // nutrient id
    value: z.number().nonnegative(), // quantity
});

export const AddFoodInputSchema = z.object({
    name: z.string().min(1, "Name is required"),
    nameEng: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    descriptionEng: z.string().optional(),
    nutrients: z.array(FoodNutrientInputSchema).default([]),
});

// Export types for inference
export type AddFoodInput = z.infer<typeof AddFoodInputSchema>;
export type FoodNutrientInput = z.infer<typeof FoodNutrientInputSchema>;
