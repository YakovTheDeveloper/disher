import { Prisma } from "@prisma/client"

interface PaginateOptions<TModel, TWhere> {
    prismaModel: {
        findMany: (args: {
            where?: TWhere
            skip?: number
            take?: number
            select?: any
            orderBy?: Prisma.Enumerable<Prisma.SortOrder | any>
        }) => Promise<TModel[]>
        count: (args: { where?: TWhere }) => Promise<number>
    }
    page: number
    limit: number
    where?: TWhere
    select?: any
    orderBy?: Prisma.Enumerable<Prisma.SortOrder | any>
}

export async function paginate<TModel, TWhere>({
    prismaModel,
    page,
    limit,
    where,
    select,
    orderBy,
}: PaginateOptions<TModel, TWhere>) {
    const [items, total] = await Promise.all([
        prismaModel.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            select,
            orderBy,
        }),
        prismaModel.count({ where }),
    ])

    return {
        items, // now strongly typed as TModel[]
        hasMore: page * limit < total,
    }
}
