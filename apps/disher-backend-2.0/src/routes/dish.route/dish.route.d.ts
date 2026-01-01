export declare const dihesRoutes: {
    getDishes: import("@trpc/server").TRPCQueryProcedure<{
        input: any;
        output: import("../../lib/response").IResponseData<{
            items: any;
            hasMore: boolean;
        }>;
        meta: object;
    }>;
    getDish: import("@trpc/server").TRPCQueryProcedure<{
        input: any;
        output: import("../../lib/response").IResponseData<{
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
        output: import("../../lib/response").IResponseData<{
            dishes: any[];
            notSyncIds: any[];
        }>;
        meta: object;
    }>;
};
//# sourceMappingURL=dish.route.d.ts.map