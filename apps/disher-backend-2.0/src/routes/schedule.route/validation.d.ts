import { z } from "zod";
declare const DailyEventsItemsSchema: z.ZodObject<{
    time: z.ZodString;
    content: z.ZodUnion<[z.ZodObject<{
        variant: z.ZodLiteral<"sleep">;
        content: z.ZodObject<{
            quality: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
            hours: z.ZodNumber;
            minutes: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            hours?: number;
            minutes?: number;
        }, {
            quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            hours?: number;
            minutes?: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        content?: {
            quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            hours?: number;
            minutes?: number;
        };
        variant?: "sleep";
    }, {
        content?: {
            quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            hours?: number;
            minutes?: number;
        };
        variant?: "sleep";
    }>, z.ZodObject<{
        variant: z.ZodLiteral<"mood">;
        content: z.ZodObject<{
            value: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
        }, "strip", z.ZodTypeAny, {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
        }, {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
        }>;
    }, "strip", z.ZodTypeAny, {
        content?: {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
        };
        variant?: "mood";
    }, {
        content?: {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
        };
        variant?: "mood";
    }>, z.ZodObject<{
        variant: z.ZodLiteral<"energy">;
        content: z.ZodObject<{
            value: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
        }, "strip", z.ZodTypeAny, {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
        }, {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
        }>;
    }, "strip", z.ZodTypeAny, {
        content?: {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
        };
        variant?: "energy";
    }, {
        content?: {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
        };
        variant?: "energy";
    }>, z.ZodObject<{
        variant: z.ZodLiteral<"digestion">;
        content: z.ZodObject<{
            variant: z.ZodEnum<["bloating", "stomach_pain", "heartburn", "constipation", "diarrhea"]>;
            value: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
        }, "strip", z.ZodTypeAny, {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
        }, {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
        }>;
    }, "strip", z.ZodTypeAny, {
        content?: {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
        };
        variant?: "digestion";
    }, {
        content?: {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
        };
        variant?: "digestion";
    }>, z.ZodObject<{
        variant: z.ZodLiteral<"activity">;
        content: z.ZodObject<{
            variant: z.ZodString;
            hours: z.ZodNumber;
            minutes: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            variant?: string;
            hours?: number;
            minutes?: number;
        }, {
            variant?: string;
            hours?: number;
            minutes?: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        content?: {
            variant?: string;
            hours?: number;
            minutes?: number;
        };
        variant?: "activity";
    }, {
        content?: {
            variant?: string;
            hours?: number;
            minutes?: number;
        };
        variant?: "activity";
    }>, z.ZodObject<{
        variant: z.ZodLiteral<"note">;
        content: z.ZodObject<{
            value: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            value?: string;
        }, {
            value?: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        content?: {
            value?: string;
        };
        variant?: "note";
    }, {
        content?: {
            value?: string;
        };
        variant?: "note";
    }>]>;
}, "strip", z.ZodTypeAny, {
    time?: string;
    content?: {
        content?: {
            quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            hours?: number;
            minutes?: number;
        };
        variant?: "sleep";
    } | {
        content?: {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
        };
        variant?: "mood";
    } | {
        content?: {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
        };
        variant?: "energy";
    } | {
        content?: {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
        };
        variant?: "digestion";
    } | {
        content?: {
            variant?: string;
            hours?: number;
            minutes?: number;
        };
        variant?: "activity";
    } | {
        content?: {
            value?: string;
        };
        variant?: "note";
    };
}, {
    time?: string;
    content?: {
        content?: {
            quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            hours?: number;
            minutes?: number;
        };
        variant?: "sleep";
    } | {
        content?: {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
        };
        variant?: "mood";
    } | {
        content?: {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
        };
        variant?: "energy";
    } | {
        content?: {
            value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
        };
        variant?: "digestion";
    } | {
        content?: {
            variant?: string;
            hours?: number;
            minutes?: number;
        };
        variant?: "activity";
    } | {
        content?: {
            value?: string;
        };
        variant?: "note";
    };
}>;
export declare const DailyEventsUpdateSchema: z.ZodObject<{
    id: z.ZodNumber;
    items: z.ZodArray<z.ZodObject<{
        time: z.ZodString;
        content: z.ZodUnion<[z.ZodObject<{
            variant: z.ZodLiteral<"sleep">;
            content: z.ZodObject<{
                quality: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
                hours: z.ZodNumber;
                minutes: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            }, {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        }, {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"mood">;
            content: z.ZodObject<{
                value: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
            }, "strip", z.ZodTypeAny, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            }, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        }, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"energy">;
            content: z.ZodObject<{
                value: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
            }, "strip", z.ZodTypeAny, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            }, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        }, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"digestion">;
            content: z.ZodObject<{
                variant: z.ZodEnum<["bloating", "stomach_pain", "heartburn", "constipation", "diarrhea"]>;
                value: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
            }, "strip", z.ZodTypeAny, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            }, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        }, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"activity">;
            content: z.ZodObject<{
                variant: z.ZodString;
                hours: z.ZodNumber;
                minutes: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                variant?: string;
                hours?: number;
                minutes?: number;
            }, {
                variant?: string;
                hours?: number;
                minutes?: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        }, {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"note">;
            content: z.ZodObject<{
                value: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                value?: string;
            }, {
                value?: string;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                value?: string;
            };
            variant?: "note";
        }, {
            content?: {
                value?: string;
            };
            variant?: "note";
        }>]>;
    }, "strip", z.ZodTypeAny, {
        time?: string;
        content?: {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        } | {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        } | {
            content?: {
                value?: string;
            };
            variant?: "note";
        };
    }, {
        time?: string;
        content?: {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        } | {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        } | {
            content?: {
                value?: string;
            };
            variant?: "note";
        };
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items?: {
        time?: string;
        content?: {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        } | {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        } | {
            content?: {
                value?: string;
            };
            variant?: "note";
        };
    }[];
    id?: number;
}, {
    items?: {
        time?: string;
        content?: {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        } | {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        } | {
            content?: {
                value?: string;
            };
            variant?: "note";
        };
    }[];
    id?: number;
}>;
export type DailyEvents = z.infer<typeof DailyEventsUpdateSchema>;
export type DailyEventEntity = z.infer<typeof DailyEventsItemsSchema>;
export declare const ScheduleItemUpdateZod: z.ZodObject<{
    id: z.ZodNumber;
    quantity: z.ZodOptional<z.ZodNumber>;
    time: z.ZodOptional<z.ZodString>;
    customFoodName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    foodId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    dishId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    time?: string;
    id?: number;
    quantity?: number;
    customFoodName?: string;
    foodId?: number;
    dishId?: number;
}, {
    time?: string;
    id?: number;
    quantity?: number;
    customFoodName?: string;
    foodId?: number;
    dishId?: number;
}>;
export declare const ScheduleChangesZod: z.ZodObject<{
    create: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"food">;
        quantity: z.ZodNumber;
        time: z.ZodString;
        foodId: z.ZodNumber;
        customFoodName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        dishId: z.ZodOptional<z.ZodNever>;
    }, "strip", z.ZodTypeAny, {
        dishId: never;
        time?: string;
        type?: "food";
        quantity?: number;
        customFoodName?: string;
        foodId?: number;
    }, {
        dishId: never;
        time?: string;
        type?: "food";
        quantity?: number;
        customFoodName?: string;
        foodId?: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"dish">;
        quantity: z.ZodNumber;
        time: z.ZodString;
        dishId: z.ZodNumber;
        customFoodName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        foodId: z.ZodOptional<z.ZodNever>;
    }, "strip", z.ZodTypeAny, {
        foodId: never;
        time?: string;
        type?: "dish";
        quantity?: number;
        customFoodName?: string;
        dishId?: number;
    }, {
        foodId: never;
        time?: string;
        type?: "dish";
        quantity?: number;
        customFoodName?: string;
        dishId?: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"custom">;
        quantity: z.ZodNumber;
        time: z.ZodString;
        customFoodName: z.ZodString;
        foodId: z.ZodOptional<z.ZodNever>;
        dishId: z.ZodOptional<z.ZodNever>;
    }, "strip", z.ZodTypeAny, {
        foodId: never;
        dishId: never;
        time?: string;
        type?: "custom";
        quantity?: number;
        customFoodName?: string;
    }, {
        foodId: never;
        dishId: never;
        time?: string;
        type?: "custom";
        quantity?: number;
        customFoodName?: string;
    }>]>, "many">>;
    update: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        quantity: z.ZodOptional<z.ZodNumber>;
        time: z.ZodOptional<z.ZodString>;
        customFoodName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        foodId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        dishId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        time?: string;
        id?: number;
        quantity?: number;
        customFoodName?: string;
        foodId?: number;
        dishId?: number;
    }, {
        time?: string;
        id?: number;
        quantity?: number;
        customFoodName?: string;
        foodId?: number;
        dishId?: number;
    }>, "many">>;
    delete: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    create?: ({
        dishId: never;
        time?: string;
        type?: "food";
        quantity?: number;
        customFoodName?: string;
        foodId?: number;
    } | {
        foodId: never;
        time?: string;
        type?: "dish";
        quantity?: number;
        customFoodName?: string;
        dishId?: number;
    } | {
        foodId: never;
        dishId: never;
        time?: string;
        type?: "custom";
        quantity?: number;
        customFoodName?: string;
    })[];
    update?: {
        time?: string;
        id?: number;
        quantity?: number;
        customFoodName?: string;
        foodId?: number;
        dishId?: number;
    }[];
    delete?: number[];
}, {
    create?: ({
        dishId: never;
        time?: string;
        type?: "food";
        quantity?: number;
        customFoodName?: string;
        foodId?: number;
    } | {
        foodId: never;
        time?: string;
        type?: "dish";
        quantity?: number;
        customFoodName?: string;
        dishId?: number;
    } | {
        foodId: never;
        dishId: never;
        time?: string;
        type?: "custom";
        quantity?: number;
        customFoodName?: string;
    })[];
    update?: {
        time?: string;
        id?: number;
        quantity?: number;
        customFoodName?: string;
        foodId?: number;
        dishId?: number;
    }[];
    delete?: number[];
}>;
export declare const ScheduleUpdateInputZod: z.ZodObject<{
    id: z.ZodNumber;
    date: z.ZodOptional<z.ZodString>;
    dailyEvents: z.ZodOptional<z.ZodArray<z.ZodObject<{
        time: z.ZodString;
        content: z.ZodUnion<[z.ZodObject<{
            variant: z.ZodLiteral<"sleep">;
            content: z.ZodObject<{
                quality: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
                hours: z.ZodNumber;
                minutes: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            }, {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        }, {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"mood">;
            content: z.ZodObject<{
                value: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
            }, "strip", z.ZodTypeAny, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            }, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        }, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"energy">;
            content: z.ZodObject<{
                value: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
            }, "strip", z.ZodTypeAny, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            }, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        }, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"digestion">;
            content: z.ZodObject<{
                variant: z.ZodEnum<["bloating", "stomach_pain", "heartburn", "constipation", "diarrhea"]>;
                value: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
            }, "strip", z.ZodTypeAny, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            }, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        }, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"activity">;
            content: z.ZodObject<{
                variant: z.ZodString;
                hours: z.ZodNumber;
                minutes: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                variant?: string;
                hours?: number;
                minutes?: number;
            }, {
                variant?: string;
                hours?: number;
                minutes?: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        }, {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"note">;
            content: z.ZodObject<{
                value: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                value?: string;
            }, {
                value?: string;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                value?: string;
            };
            variant?: "note";
        }, {
            content?: {
                value?: string;
            };
            variant?: "note";
        }>]>;
    }, "strip", z.ZodTypeAny, {
        time?: string;
        content?: {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        } | {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        } | {
            content?: {
                value?: string;
            };
            variant?: "note";
        };
    }, {
        time?: string;
        content?: {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        } | {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        } | {
            content?: {
                value?: string;
            };
            variant?: "note";
        };
    }>, "many">>;
    changes: z.ZodOptional<z.ZodObject<{
        create: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"food">;
            quantity: z.ZodNumber;
            time: z.ZodString;
            foodId: z.ZodNumber;
            customFoodName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            dishId: z.ZodOptional<z.ZodNever>;
        }, "strip", z.ZodTypeAny, {
            dishId: never;
            time?: string;
            type?: "food";
            quantity?: number;
            customFoodName?: string;
            foodId?: number;
        }, {
            dishId: never;
            time?: string;
            type?: "food";
            quantity?: number;
            customFoodName?: string;
            foodId?: number;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"dish">;
            quantity: z.ZodNumber;
            time: z.ZodString;
            dishId: z.ZodNumber;
            customFoodName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            foodId: z.ZodOptional<z.ZodNever>;
        }, "strip", z.ZodTypeAny, {
            foodId: never;
            time?: string;
            type?: "dish";
            quantity?: number;
            customFoodName?: string;
            dishId?: number;
        }, {
            foodId: never;
            time?: string;
            type?: "dish";
            quantity?: number;
            customFoodName?: string;
            dishId?: number;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"custom">;
            quantity: z.ZodNumber;
            time: z.ZodString;
            customFoodName: z.ZodString;
            foodId: z.ZodOptional<z.ZodNever>;
            dishId: z.ZodOptional<z.ZodNever>;
        }, "strip", z.ZodTypeAny, {
            foodId: never;
            dishId: never;
            time?: string;
            type?: "custom";
            quantity?: number;
            customFoodName?: string;
        }, {
            foodId: never;
            dishId: never;
            time?: string;
            type?: "custom";
            quantity?: number;
            customFoodName?: string;
        }>]>, "many">>;
        update: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodNumber;
            quantity: z.ZodOptional<z.ZodNumber>;
            time: z.ZodOptional<z.ZodString>;
            customFoodName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            foodId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            dishId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            time?: string;
            id?: number;
            quantity?: number;
            customFoodName?: string;
            foodId?: number;
            dishId?: number;
        }, {
            time?: string;
            id?: number;
            quantity?: number;
            customFoodName?: string;
            foodId?: number;
            dishId?: number;
        }>, "many">>;
        delete: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        create?: ({
            dishId: never;
            time?: string;
            type?: "food";
            quantity?: number;
            customFoodName?: string;
            foodId?: number;
        } | {
            foodId: never;
            time?: string;
            type?: "dish";
            quantity?: number;
            customFoodName?: string;
            dishId?: number;
        } | {
            foodId: never;
            dishId: never;
            time?: string;
            type?: "custom";
            quantity?: number;
            customFoodName?: string;
        })[];
        update?: {
            time?: string;
            id?: number;
            quantity?: number;
            customFoodName?: string;
            foodId?: number;
            dishId?: number;
        }[];
        delete?: number[];
    }, {
        create?: ({
            dishId: never;
            time?: string;
            type?: "food";
            quantity?: number;
            customFoodName?: string;
            foodId?: number;
        } | {
            foodId: never;
            time?: string;
            type?: "dish";
            quantity?: number;
            customFoodName?: string;
            dishId?: number;
        } | {
            foodId: never;
            dishId: never;
            time?: string;
            type?: "custom";
            quantity?: number;
            customFoodName?: string;
        })[];
        update?: {
            time?: string;
            id?: number;
            quantity?: number;
            customFoodName?: string;
            foodId?: number;
            dishId?: number;
        }[];
        delete?: number[];
    }>>;
}, "strip", z.ZodTypeAny, {
    date?: string;
    id?: number;
    dailyEvents?: {
        time?: string;
        content?: {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        } | {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        } | {
            content?: {
                value?: string;
            };
            variant?: "note";
        };
    }[];
    changes?: {
        create?: ({
            dishId: never;
            time?: string;
            type?: "food";
            quantity?: number;
            customFoodName?: string;
            foodId?: number;
        } | {
            foodId: never;
            time?: string;
            type?: "dish";
            quantity?: number;
            customFoodName?: string;
            dishId?: number;
        } | {
            foodId: never;
            dishId: never;
            time?: string;
            type?: "custom";
            quantity?: number;
            customFoodName?: string;
        })[];
        update?: {
            time?: string;
            id?: number;
            quantity?: number;
            customFoodName?: string;
            foodId?: number;
            dishId?: number;
        }[];
        delete?: number[];
    };
}, {
    date?: string;
    id?: number;
    dailyEvents?: {
        time?: string;
        content?: {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        } | {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        } | {
            content?: {
                value?: string;
            };
            variant?: "note";
        };
    }[];
    changes?: {
        create?: ({
            dishId: never;
            time?: string;
            type?: "food";
            quantity?: number;
            customFoodName?: string;
            foodId?: number;
        } | {
            foodId: never;
            time?: string;
            type?: "dish";
            quantity?: number;
            customFoodName?: string;
            dishId?: number;
        } | {
            foodId: never;
            dishId: never;
            time?: string;
            type?: "custom";
            quantity?: number;
            customFoodName?: string;
        })[];
        update?: {
            time?: string;
            id?: number;
            quantity?: number;
            customFoodName?: string;
            foodId?: number;
            dishId?: number;
        }[];
        delete?: number[];
    };
}>;
export declare const ScheduleCreateInputZod: z.ZodObject<{
    date: z.ZodString;
    dailyEvents: z.ZodArray<z.ZodObject<{
        time: z.ZodString;
        content: z.ZodUnion<[z.ZodObject<{
            variant: z.ZodLiteral<"sleep">;
            content: z.ZodObject<{
                quality: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
                hours: z.ZodNumber;
                minutes: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            }, {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        }, {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"mood">;
            content: z.ZodObject<{
                value: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
            }, "strip", z.ZodTypeAny, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            }, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        }, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"energy">;
            content: z.ZodObject<{
                value: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
            }, "strip", z.ZodTypeAny, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            }, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        }, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"digestion">;
            content: z.ZodObject<{
                variant: z.ZodEnum<["bloating", "stomach_pain", "heartburn", "constipation", "diarrhea"]>;
                value: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>, z.ZodLiteral<6>, z.ZodLiteral<7>, z.ZodLiteral<8>, z.ZodLiteral<9>, z.ZodLiteral<10>]>;
            }, "strip", z.ZodTypeAny, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            }, {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        }, {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"activity">;
            content: z.ZodObject<{
                variant: z.ZodString;
                hours: z.ZodNumber;
                minutes: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                variant?: string;
                hours?: number;
                minutes?: number;
            }, {
                variant?: string;
                hours?: number;
                minutes?: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        }, {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        }>, z.ZodObject<{
            variant: z.ZodLiteral<"note">;
            content: z.ZodObject<{
                value: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                value?: string;
            }, {
                value?: string;
            }>;
        }, "strip", z.ZodTypeAny, {
            content?: {
                value?: string;
            };
            variant?: "note";
        }, {
            content?: {
                value?: string;
            };
            variant?: "note";
        }>]>;
    }, "strip", z.ZodTypeAny, {
        time?: string;
        content?: {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        } | {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        } | {
            content?: {
                value?: string;
            };
            variant?: "note";
        };
    }, {
        time?: string;
        content?: {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        } | {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        } | {
            content?: {
                value?: string;
            };
            variant?: "note";
        };
    }>, "many">;
    items: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"food">;
        quantity: z.ZodNumber;
        time: z.ZodString;
        foodId: z.ZodNumber;
        customFoodName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        dishId: z.ZodOptional<z.ZodNever>;
    }, "strip", z.ZodTypeAny, {
        dishId: never;
        time?: string;
        type?: "food";
        quantity?: number;
        customFoodName?: string;
        foodId?: number;
    }, {
        dishId: never;
        time?: string;
        type?: "food";
        quantity?: number;
        customFoodName?: string;
        foodId?: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"dish">;
        quantity: z.ZodNumber;
        time: z.ZodString;
        dishId: z.ZodNumber;
        customFoodName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        foodId: z.ZodOptional<z.ZodNever>;
    }, "strip", z.ZodTypeAny, {
        foodId: never;
        time?: string;
        type?: "dish";
        quantity?: number;
        customFoodName?: string;
        dishId?: number;
    }, {
        foodId: never;
        time?: string;
        type?: "dish";
        quantity?: number;
        customFoodName?: string;
        dishId?: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"custom">;
        quantity: z.ZodNumber;
        time: z.ZodString;
        customFoodName: z.ZodString;
        foodId: z.ZodOptional<z.ZodNever>;
        dishId: z.ZodOptional<z.ZodNever>;
    }, "strip", z.ZodTypeAny, {
        foodId: never;
        dishId: never;
        time?: string;
        type?: "custom";
        quantity?: number;
        customFoodName?: string;
    }, {
        foodId: never;
        dishId: never;
        time?: string;
        type?: "custom";
        quantity?: number;
        customFoodName?: string;
    }>]>, "many">>;
}, "strip", z.ZodTypeAny, {
    date?: string;
    items?: ({
        dishId: never;
        time?: string;
        type?: "food";
        quantity?: number;
        customFoodName?: string;
        foodId?: number;
    } | {
        foodId: never;
        time?: string;
        type?: "dish";
        quantity?: number;
        customFoodName?: string;
        dishId?: number;
    } | {
        foodId: never;
        dishId: never;
        time?: string;
        type?: "custom";
        quantity?: number;
        customFoodName?: string;
    })[];
    dailyEvents?: {
        time?: string;
        content?: {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        } | {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        } | {
            content?: {
                value?: string;
            };
            variant?: "note";
        };
    }[];
}, {
    date?: string;
    items?: ({
        dishId: never;
        time?: string;
        type?: "food";
        quantity?: number;
        customFoodName?: string;
        foodId?: number;
    } | {
        foodId: never;
        time?: string;
        type?: "dish";
        quantity?: number;
        customFoodName?: string;
        dishId?: number;
    } | {
        foodId: never;
        dishId: never;
        time?: string;
        type?: "custom";
        quantity?: number;
        customFoodName?: string;
    })[];
    dailyEvents?: {
        time?: string;
        content?: {
            content?: {
                quality?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                hours?: number;
                minutes?: number;
            };
            variant?: "sleep";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "mood";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
            };
            variant?: "energy";
        } | {
            content?: {
                value?: 1 | 2 | 3 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
            };
            variant?: "digestion";
        } | {
            content?: {
                variant?: string;
                hours?: number;
                minutes?: number;
            };
            variant?: "activity";
        } | {
            content?: {
                value?: string;
            };
            variant?: "note";
        };
    }[];
}>;
export {};
//# sourceMappingURL=validation.d.ts.map