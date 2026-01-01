import { z } from "zod";
export declare const DishItemCreateZod: z.ZodObject<{
    id: z.ZodString;
    quantity: z.ZodNumber;
    foodId: z.ZodEffects<z.ZodString, number, string>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    quantity?: number;
    foodId?: number;
}, {
    id?: string;
    quantity?: number;
    foodId?: string;
}>;
export declare const DishItemUpdateZod: z.ZodObject<{
    id: z.ZodString;
    quantity: z.ZodOptional<z.ZodNumber>;
    foodId: z.ZodEffects<z.ZodOptional<z.ZodString>, number, string>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    quantity?: number;
    foodId?: number;
}, {
    id?: string;
    quantity?: number;
    foodId?: string;
}>;
export declare const DishItemsChangesZod: z.ZodObject<{
    create: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        quantity: z.ZodNumber;
        foodId: z.ZodEffects<z.ZodString, number, string>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        quantity?: number;
        foodId?: number;
    }, {
        id?: string;
        quantity?: number;
        foodId?: string;
    }>, "many">>;
    update: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        quantity: z.ZodOptional<z.ZodNumber>;
        foodId: z.ZodEffects<z.ZodOptional<z.ZodString>, number, string>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        quantity?: number;
        foodId?: number;
    }, {
        id?: string;
        quantity?: number;
        foodId?: string;
    }>, "many">>;
    delete: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    create?: {
        id?: string;
        quantity?: number;
        foodId?: number;
    }[];
    update?: {
        id?: string;
        quantity?: number;
        foodId?: number;
    }[];
    delete?: string[];
}, {
    create?: {
        id?: string;
        quantity?: number;
        foodId?: string;
    }[];
    update?: {
        id?: string;
        quantity?: number;
        foodId?: string;
    }[];
    delete?: string[];
}>;
export declare const DishZod: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    userId: z.ZodNumber;
    items: z.ZodObject<{
        create: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            quantity: z.ZodNumber;
            foodId: z.ZodEffects<z.ZodString, number, string>;
        }, "strip", z.ZodTypeAny, {
            id?: string;
            quantity?: number;
            foodId?: number;
        }, {
            id?: string;
            quantity?: number;
            foodId?: string;
        }>, "many">>;
        update: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            quantity: z.ZodOptional<z.ZodNumber>;
            foodId: z.ZodEffects<z.ZodOptional<z.ZodString>, number, string>;
        }, "strip", z.ZodTypeAny, {
            id?: string;
            quantity?: number;
            foodId?: number;
        }, {
            id?: string;
            quantity?: number;
            foodId?: string;
        }>, "many">>;
        delete: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        create?: {
            id?: string;
            quantity?: number;
            foodId?: number;
        }[];
        update?: {
            id?: string;
            quantity?: number;
            foodId?: number;
        }[];
        delete?: string[];
    }, {
        create?: {
            id?: string;
            quantity?: number;
            foodId?: string;
        }[];
        update?: {
            id?: string;
            quantity?: number;
            foodId?: string;
        }[];
        delete?: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    items?: {
        create?: {
            id?: string;
            quantity?: number;
            foodId?: number;
        }[];
        update?: {
            id?: string;
            quantity?: number;
            foodId?: number;
        }[];
        delete?: string[];
    };
    name?: string;
    id?: string;
    userId?: number;
}, {
    items?: {
        create?: {
            id?: string;
            quantity?: number;
            foodId?: string;
        }[];
        update?: {
            id?: string;
            quantity?: number;
            foodId?: string;
        }[];
        delete?: string[];
    };
    name?: string;
    id?: string;
    userId?: number;
}>;
export declare const DishSyncInputZod: z.ZodObject<{
    dishes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        userId: z.ZodNumber;
        items: z.ZodObject<{
            create: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                quantity: z.ZodNumber;
                foodId: z.ZodEffects<z.ZodString, number, string>;
            }, "strip", z.ZodTypeAny, {
                id?: string;
                quantity?: number;
                foodId?: number;
            }, {
                id?: string;
                quantity?: number;
                foodId?: string;
            }>, "many">>;
            update: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                quantity: z.ZodOptional<z.ZodNumber>;
                foodId: z.ZodEffects<z.ZodOptional<z.ZodString>, number, string>;
            }, "strip", z.ZodTypeAny, {
                id?: string;
                quantity?: number;
                foodId?: number;
            }, {
                id?: string;
                quantity?: number;
                foodId?: string;
            }>, "many">>;
            delete: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            create?: {
                id?: string;
                quantity?: number;
                foodId?: number;
            }[];
            update?: {
                id?: string;
                quantity?: number;
                foodId?: number;
            }[];
            delete?: string[];
        }, {
            create?: {
                id?: string;
                quantity?: number;
                foodId?: string;
            }[];
            update?: {
                id?: string;
                quantity?: number;
                foodId?: string;
            }[];
            delete?: string[];
        }>;
    }, "strip", z.ZodTypeAny, {
        items?: {
            create?: {
                id?: string;
                quantity?: number;
                foodId?: number;
            }[];
            update?: {
                id?: string;
                quantity?: number;
                foodId?: number;
            }[];
            delete?: string[];
        };
        name?: string;
        id?: string;
        userId?: number;
    }, {
        items?: {
            create?: {
                id?: string;
                quantity?: number;
                foodId?: string;
            }[];
            update?: {
                id?: string;
                quantity?: number;
                foodId?: string;
            }[];
            delete?: string[];
        };
        name?: string;
        id?: string;
        userId?: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    dishes?: {
        items?: {
            create?: {
                id?: string;
                quantity?: number;
                foodId?: number;
            }[];
            update?: {
                id?: string;
                quantity?: number;
                foodId?: number;
            }[];
            delete?: string[];
        };
        name?: string;
        id?: string;
        userId?: number;
    }[];
}, {
    dishes?: {
        items?: {
            create?: {
                id?: string;
                quantity?: number;
                foodId?: string;
            }[];
            update?: {
                id?: string;
                quantity?: number;
                foodId?: string;
            }[];
            delete?: string[];
        };
        name?: string;
        id?: string;
        userId?: number;
    }[];
}>;
export type DishSyncInput = z.infer<typeof DishSyncInputZod>;
export type DishItemsChangesZodInput = z.infer<typeof DishItemsChangesZod>;
export type DishZodType = z.infer<typeof DishZod>;
//# sourceMappingURL=dish.validation.d.ts.map