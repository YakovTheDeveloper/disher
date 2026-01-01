export declare const foodRoutes: {
    getFoodByIds: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            ids?: number[];
        };
        output: import("../../lib/response").IResponseData<{
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
        output: import("../../lib/response").IResponseData<{
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
        output: import("../../lib/response").IResponseData<{
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
        output: import("../../lib/response").IResponseData<any>;
        meta: object;
    }>;
};
//# sourceMappingURL=food.route.d.ts.map