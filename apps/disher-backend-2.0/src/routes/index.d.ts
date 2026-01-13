export declare const appRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: object;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getDailyNorms: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: import("../lib/response").IResponseData<{
            id: number;
            name: string;
            description: string;
            items: {
                quantity: number;
                nutrientId: number;
            }[];
        }[]>;
        meta: object;
    }>;
    createDailyNorms: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name?: string;
            description?: string;
            items?: {
                quantity?: number;
                nutrientId?: number;
            }[];
        };
        output: import("../lib/response").IResponseData<{
            id: number;
            name: string;
            description: string;
            items: {
                quantity: number;
                nutrientId: number;
            }[];
        }>;
        meta: object;
    }>;
    updateDailyNorms: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id?: number;
            name?: string;
            description?: string;
            items?: {
                quantity?: number;
                nutrientId?: number;
            }[];
        };
        output: import("../lib/response").IResponseData<{
            id: number;
            name: string;
            description: string;
            items: {
                quantity: number;
                nutrientId: number;
            }[];
        }>;
        meta: object;
    }>;
    removeDailyNorm: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id?: number;
        };
        output: import("../lib/response").IResponseData<{
            id: number;
            name: string;
            description: string;
            items: {
                quantity: number;
                nutrientId: number;
            }[];
        }>;
        meta: object;
    }>;
    getOne: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: import("../lib/response").IResponseData<{
            id: number;
            name: string;
        }[]>;
        meta: object;
    }>;
    getFoodByIds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            ids?: number[];
        };
        output: import("../lib/response").IResponseData<{
            id: number;
            name: string;
        }[]>;
        meta: object;
    }>;
    getFood: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number;
            limit?: number;
            filters?: {
                search?: string;
                category?: string;
            };
        };
        output: import("../lib/response").IResponseData<{
            items: any;
            hasMore: boolean;
        }>;
        meta: object;
    }>;
    getFoodWithNutrients: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            page?: number;
            limit?: number;
        };
        output: import("../lib/response").IResponseData<{
            items: any;
            hasMore: boolean;
            total: any;
        }>;
        meta: object;
    }>;
    getFoodWithNutrientsByIds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            ids?: number[];
        };
        output: import("../lib/response").IResponseData<{
            id: number;
            name: string;
            nutrients: {
                quantity: number;
                nutrientId: number;
            }[];
        }[]>;
        meta: object;
    }>;
    getOneFood: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id?: number;
        };
        output: import("../lib/response").IResponseData<{
            id: number;
            name: string;
            nutrients: {
                quantity: number;
                nutrientId: number;
            }[];
        }>;
        meta: object;
    }>;
    addFood: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name?: string;
            nameEng?: string;
            description?: string;
            descriptionEng?: string;
            nutrients?: {
                value?: number;
                id?: number;
            }[];
        };
        output: import("../lib/response").IResponseData<any>;
        meta: object;
    }>;
    getDishes: import("@trpc/server").TRPCQueryProcedure<{
        input: any;
        output: import("../lib/response").IResponseData<{
            items: any;
            hasMore: boolean;
        }>;
        meta: object;
    }>;
    getDish: import("@trpc/server").TRPCQueryProcedure<{
        input: any;
        output: import("../lib/response").IResponseData<{
            id: string;
            name: string;
            items: {
                id: string;
                quantity: number;
                foodId: number;
                dishId: string;
            }[];
        }[]>;
        meta: object;
    }>;
    syncDish: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            dishes?: {
                id?: string;
                name?: string;
                userId?: number;
                items?: {
                    create?: {
                        id?: string;
                        quantity?: number;
                        foodId?: string;
                    }[];
                    delete?: string[];
                    update?: {
                        id?: string;
                        quantity?: number;
                        foodId?: string;
                    }[];
                };
            }[];
        };
        output: import("../lib/response").IResponseData<{
            dishes: any[];
            notSyncIds: any[];
        }>;
        meta: object;
    }>;
    createUser: import("@trpc/server").TRPCMutationProcedure<{
        input: any;
        output: import("../lib/response").IResponseData<{
            id: number;
            name: string | null;
            email: string | null;
            image: string | null;
            createdAt: Date;
            updatedAt: Date;
        }>;
        meta: object;
    }>;
    getUser: import("@trpc/server").TRPCQueryProcedure<{
        input: any;
        output: {
            id: number;
            name: string | null;
            email: string | null;
            image: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    getSchedules: import("@trpc/server").TRPCQueryProcedure<{
        input: any;
        output: import("../lib/response").IResponseData<{
            id: string;
            userId: number;
            createdAt: Date;
            updatedAt: Date;
        }[]>;
        meta: object;
    }>;
    getOneSchedule: import("@trpc/server").TRPCQueryProcedure<{
        input: any;
        output: import("../lib/response").IResponseData<any>;
        meta: object;
    }>;
    addSchedule: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            items?: ({
                dishId: never;
                type?: "food";
                quantity?: number;
                foodId?: number;
                time?: string;
                customFoodName?: string;
            } | {
                foodId: never;
                type?: "dish";
                quantity?: number;
                time?: string;
                customFoodName?: string;
                dishId?: number;
            } | {
                foodId: never;
                dishId: never;
                type?: "custom";
                quantity?: number;
                time?: string;
                customFoodName?: string;
            })[];
            date?: string;
            dailyEvents?: {
                time?: string;
                content?: {
                    variant?: "sleep";
                    content?: {
                        quality?: 3 | 1 | 2 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
                        hours?: number;
                        minutes?: number;
                    };
                } | {
                    variant?: "mood";
                    content?: {
                        value?: 3 | 1 | 2 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
                    };
                } | {
                    variant?: "energy";
                    content?: {
                        value?: 3 | 1 | 2 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
                    };
                } | {
                    variant?: "digestion";
                    content?: {
                        value?: 3 | 1 | 2 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
                        variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
                    };
                } | {
                    variant?: "activity";
                    content?: {
                        variant?: string;
                        hours?: number;
                        minutes?: number;
                    };
                } | {
                    variant?: "note";
                    content?: {
                        value?: string;
                    };
                };
            }[];
        };
        output: import("../lib/response").IResponseData<any>;
        meta: object;
    }>;
    updateScheduleDailyEvents: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id?: number;
            items?: {
                time?: string;
                content?: {
                    variant?: "sleep";
                    content?: {
                        quality?: 3 | 1 | 2 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
                        hours?: number;
                        minutes?: number;
                    };
                } | {
                    variant?: "mood";
                    content?: {
                        value?: 3 | 1 | 2 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
                    };
                } | {
                    variant?: "energy";
                    content?: {
                        value?: 3 | 1 | 2 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
                    };
                } | {
                    variant?: "digestion";
                    content?: {
                        value?: 3 | 1 | 2 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
                        variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
                    };
                } | {
                    variant?: "activity";
                    content?: {
                        variant?: string;
                        hours?: number;
                        minutes?: number;
                    };
                } | {
                    variant?: "note";
                    content?: {
                        value?: string;
                    };
                };
            }[];
        };
        output: import("../lib/response").IResponseData<any>;
        meta: object;
    }>;
    updateSchedule: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id?: number;
            date?: string;
            dailyEvents?: {
                time?: string;
                content?: {
                    variant?: "sleep";
                    content?: {
                        quality?: 3 | 1 | 2 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
                        hours?: number;
                        minutes?: number;
                    };
                } | {
                    variant?: "mood";
                    content?: {
                        value?: 3 | 1 | 2 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
                    };
                } | {
                    variant?: "energy";
                    content?: {
                        value?: 3 | 1 | 2 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
                    };
                } | {
                    variant?: "digestion";
                    content?: {
                        value?: 3 | 1 | 2 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
                        variant?: "bloating" | "stomach_pain" | "heartburn" | "constipation" | "diarrhea";
                    };
                } | {
                    variant?: "activity";
                    content?: {
                        variant?: string;
                        hours?: number;
                        minutes?: number;
                    };
                } | {
                    variant?: "note";
                    content?: {
                        value?: string;
                    };
                };
            }[];
            changes?: {
                create?: ({
                    dishId: never;
                    type?: "food";
                    quantity?: number;
                    foodId?: number;
                    time?: string;
                    customFoodName?: string;
                } | {
                    foodId: never;
                    type?: "dish";
                    quantity?: number;
                    time?: string;
                    customFoodName?: string;
                    dishId?: number;
                } | {
                    foodId: never;
                    dishId: never;
                    type?: "custom";
                    quantity?: number;
                    time?: string;
                    customFoodName?: string;
                })[];
                delete?: number[];
                update?: {
                    id?: number;
                    quantity?: number;
                    foodId?: number;
                    time?: string;
                    customFoodName?: string;
                    dishId?: number;
                }[];
            };
        };
        output: import("../lib/response").IResponseData<any>;
        meta: object;
    }>;
    syncSchedule: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            schedules?: {
                id?: string;
                userId?: number;
                items?: {
                    create?: {
                        id?: string;
                        quantity?: number;
                        time?: string;
                        content?: {
                            foodId?: string;
                            dishId?: string;
                            variant?: "food" | "dish" | "custom";
                            customName?: string;
                        };
                    }[];
                    delete?: string[];
                    update?: {
                        id?: string;
                        quantity?: number;
                        time?: string;
                        content?: {
                            foodId?: string;
                            dishId?: string;
                            variant?: "food" | "dish" | "custom";
                            customName?: string;
                        };
                    }[];
                };
                events?: {
                    create?: {
                        value?: string;
                        type?: string;
                        id?: string;
                    }[];
                    delete?: string[];
                    update?: {
                        value?: string;
                        type?: string;
                        id?: string;
                    }[];
                };
            }[];
        };
        output: import("../lib/response").IResponseData<any[]>;
        meta: object;
    }>;
}>>;
export type AppRouter = typeof appRouter;
//# sourceMappingURL=index.d.ts.map