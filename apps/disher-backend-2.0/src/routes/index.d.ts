export declare const appRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: object;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getDailyNorms: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: import("../lib/response").IResponseData<{
            description: string;
            items: {
                quantity: number;
                nutrientId: number;
            }[];
            name: string;
            id: number;
        }[]>;
        meta: object;
    }>;
    createDailyNorms: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            description?: string;
            items?: {
                quantity?: number;
                nutrientId?: number;
            }[];
            name?: string;
        };
        output: import("../lib/response").IResponseData<{
            description: string;
            items: {
                quantity: number;
                nutrientId: number;
            }[];
            name: string;
            id: number;
        }>;
        meta: object;
    }>;
    updateDailyNorms: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            description?: string;
            items?: {
                quantity?: number;
                nutrientId?: number;
            }[];
            name?: string;
            id?: number;
        };
        output: import("../lib/response").IResponseData<{
            description: string;
            items: {
                quantity: number;
                nutrientId: number;
            }[];
            name: string;
            id: number;
        }>;
        meta: object;
    }>;
    removeDailyNorm: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id?: number;
        };
        output: import("../lib/response").IResponseData<{
            description: string;
            items: {
                quantity: number;
                nutrientId: number;
            }[];
            name: string;
            id: number;
        }>;
        meta: object;
    }>;
    getOne: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: import("../lib/response").IResponseData<{
            name: string;
            id: number;
        }[]>;
        meta: object;
    }>;
    getFoodByIds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            ids?: number[];
        };
        output: import("../lib/response").IResponseData<{
            name: string;
            id: number;
        }[]>;
        meta: object;
    }>;
    getFood: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            limit?: number;
            page?: number;
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
            limit?: number;
            page?: number;
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
            name: string;
            id: number;
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
            name: string;
            id: number;
            nutrients: {
                quantity: number;
                nutrientId: number;
            }[];
        }>;
        meta: object;
    }>;
    addFood: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            description?: string;
            name?: string;
            nameEng?: string;
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
            items: {
                id: string;
                quantity: number;
                foodId: number;
                dishId: string;
            }[];
            name: string;
            id: string;
        }[]>;
        meta: object;
    }>;
    syncDish: import("@trpc/server").TRPCMutationProcedure<{
        input: {
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
            email: string | null;
            name: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            image: string | null;
        }>;
        meta: object;
    }>;
    getUser: import("@trpc/server").TRPCQueryProcedure<{
        input: any;
        output: {
            email: string | null;
            name: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            image: string | null;
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
            date?: string;
            items?: ({
                dishId: never;
                type?: "food";
                time?: string;
                quantity?: number;
                customFoodName?: string;
                foodId?: number;
            } | {
                foodId: never;
                type?: "dish";
                time?: string;
                quantity?: number;
                customFoodName?: string;
                dishId?: number;
            } | {
                foodId: never;
                dishId: never;
                type?: "custom";
                time?: string;
                quantity?: number;
                customFoodName?: string;
            })[];
            dailyEvents?: {
                time?: string;
                content?: {
                    content?: {
                        quality?: 1 | 3 | 2 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                        hours?: number;
                        minutes?: number;
                    };
                    variant?: "sleep";
                } | {
                    content?: {
                        value?: 1 | 3 | 2 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                    };
                    variant?: "mood";
                } | {
                    content?: {
                        value?: 1 | 3 | 2 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                    };
                    variant?: "energy";
                } | {
                    content?: {
                        value?: 1 | 3 | 2 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
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
        };
        output: import("../lib/response").IResponseData<any>;
        meta: object;
    }>;
    updateScheduleDailyEvents: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            items?: {
                time?: string;
                content?: {
                    content?: {
                        quality?: 1 | 3 | 2 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                        hours?: number;
                        minutes?: number;
                    };
                    variant?: "sleep";
                } | {
                    content?: {
                        value?: 1 | 3 | 2 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                    };
                    variant?: "mood";
                } | {
                    content?: {
                        value?: 1 | 3 | 2 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                    };
                    variant?: "energy";
                } | {
                    content?: {
                        value?: 1 | 3 | 2 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
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
        };
        output: import("../lib/response").IResponseData<any>;
        meta: object;
    }>;
    updateSchedule: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            date?: string;
            id?: number;
            dailyEvents?: {
                time?: string;
                content?: {
                    content?: {
                        quality?: 1 | 3 | 2 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                        hours?: number;
                        minutes?: number;
                    };
                    variant?: "sleep";
                } | {
                    content?: {
                        value?: 1 | 3 | 2 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                    };
                    variant?: "mood";
                } | {
                    content?: {
                        value?: 1 | 3 | 2 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
                    };
                    variant?: "energy";
                } | {
                    content?: {
                        value?: 1 | 3 | 2 | 4 | 5 | 8 | 6 | 7 | 9 | 10;
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
                    type?: "food";
                    time?: string;
                    quantity?: number;
                    customFoodName?: string;
                    foodId?: number;
                } | {
                    foodId: never;
                    type?: "dish";
                    time?: string;
                    quantity?: number;
                    customFoodName?: string;
                    dishId?: number;
                } | {
                    foodId: never;
                    dishId: never;
                    type?: "custom";
                    time?: string;
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
        };
        output: import("../lib/response").IResponseData<any>;
        meta: object;
    }>;
    syncSchedule: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            schedules?: {
                items?: {
                    create?: {
                        time?: string;
                        id?: string;
                        content?: {
                            foodId?: string;
                            dishId?: string;
                            variant?: "custom" | "food" | "dish";
                            customName?: string;
                        };
                        quantity?: number;
                    }[];
                    update?: {
                        time?: string;
                        id?: string;
                        content?: {
                            foodId?: string;
                            dishId?: string;
                            variant?: "custom" | "food" | "dish";
                            customName?: string;
                        };
                        quantity?: number;
                    }[];
                    delete?: string[];
                };
                id?: string;
                userId?: number;
                events?: {
                    create?: {
                        value?: string;
                        type?: string;
                        id?: string;
                    }[];
                    update?: {
                        value?: string;
                        type?: string;
                        id?: string;
                    }[];
                    delete?: string[];
                };
            }[];
        };
        output: import("../lib/response").IResponseData<any[]>;
        meta: object;
    }>;
}>>;
export type AppRouter = typeof appRouter;
//# sourceMappingURL=index.d.ts.map