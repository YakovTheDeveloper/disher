export declare const userRoutes: {
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
};
//# sourceMappingURL=user.route.d.ts.map