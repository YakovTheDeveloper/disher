export declare const scheduleItemSelect: {
    dish: {
        select: {
            id: boolean;
            name: boolean;
            items: {
                select: {
                    quantity: boolean;
                    food: {
                        select: {
                            id: boolean;
                            name: boolean;
                        };
                    };
                };
            };
        };
    };
    food: {
        select: {
            id: boolean;
            name: boolean;
        };
    };
    customFoodName: boolean;
    id: boolean;
    quantity: boolean;
    time: boolean;
};
export declare const scheduleRoutes: {
    getSchedules: import("@trpc/server").TRPCQueryProcedure<{
        input: any;
        output: import("../../lib/response").IResponseData<{
            id: string;
            userId: number;
            createdAt: Date;
            updatedAt: Date;
        }[]>;
        meta: object;
    }>;
    getOneSchedule: import("@trpc/server").TRPCQueryProcedure<{
        input: any;
        output: import("../../lib/response").IResponseData<any>;
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
        output: import("../../lib/response").IResponseData<any>;
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
        output: import("../../lib/response").IResponseData<any>;
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
        output: import("../../lib/response").IResponseData<any>;
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
        output: import("../../lib/response").IResponseData<any[]>;
        meta: object;
    }>;
};
//# sourceMappingURL=schedule.route.d.ts.map