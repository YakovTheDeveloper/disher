import { Prisma } from "@prisma/client";
interface PaginateOptions<TModel, TWhere> {
    prismaModel: {
        findMany: (args: {
            where?: TWhere;
            skip?: number;
            take?: number;
            select?: any;
            orderBy?: Prisma.Enumerable<Prisma.SortOrder | any>;
        }) => Promise<TModel[]>;
        count: (args: {
            where?: TWhere;
        }) => Promise<number>;
    };
    page: number;
    limit: number;
    where?: TWhere;
    select?: any;
    orderBy?: Prisma.Enumerable<Prisma.SortOrder | any>;
}
export declare function paginate<TModel, TWhere>({ prismaModel, page, limit, where, select, orderBy, }: PaginateOptions<TModel, TWhere>): Promise<{
    items: any;
    hasMore: boolean;
}>;
export {};
//# sourceMappingURL=pagination.d.ts.map