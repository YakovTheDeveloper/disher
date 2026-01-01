import { z } from "zod";
export declare const FoodNutrientInputSchema: z.ZodObject<{
    id: z.ZodNumber;
    value: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    value?: number;
    id?: number;
}, {
    value?: number;
    id?: number;
}>;
export declare const AddFoodInputSchema: z.ZodObject<{
    name: z.ZodString;
    nameEng: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    descriptionEng: z.ZodOptional<z.ZodString>;
    nutrients: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value?: number;
        id?: number;
    }, {
        value?: number;
        id?: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    description?: string;
    name?: string;
    nameEng?: string;
    descriptionEng?: string;
    nutrients?: {
        value?: number;
        id?: number;
    }[];
}, {
    description?: string;
    name?: string;
    nameEng?: string;
    descriptionEng?: string;
    nutrients?: {
        value?: number;
        id?: number;
    }[];
}>;
export type AddFoodInput = z.infer<typeof AddFoodInputSchema>;
export type FoodNutrientInput = z.infer<typeof FoodNutrientInputSchema>;
//# sourceMappingURL=validation.d.ts.map