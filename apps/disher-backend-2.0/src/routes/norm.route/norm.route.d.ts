export declare const dailyNormRoute: {
    getDailyNorms: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: import("../../lib/response").IResponseData<{
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
        output: import("../../lib/response").IResponseData<{
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
        output: import("../../lib/response").IResponseData<{
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
        output: import("../../lib/response").IResponseData<{
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
};
//# sourceMappingURL=norm.route.d.ts.map