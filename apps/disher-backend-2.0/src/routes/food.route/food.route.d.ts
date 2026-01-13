export declare const foodRoutes: {
    getFoodByIds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            ids?: number[];
        };
        output: import("../../lib/response").IResponseData<{
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
        output: import("../../lib/response").IResponseData<{
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
        output: import("../../lib/response").IResponseData<{
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
        output: import("../../lib/response").IResponseData<{
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
        output: import("../../lib/response").IResponseData<{
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
        output: import("../../lib/response").IResponseData<any>;
        meta: object;
    }>;
};
//# sourceMappingURL=food.route.d.ts.map