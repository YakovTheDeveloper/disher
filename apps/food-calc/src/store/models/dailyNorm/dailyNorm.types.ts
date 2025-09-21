import { trpc } from "@/api/trpc/trpc";

export type DailyNormEntity = NonNullable<
    Awaited<ReturnType<typeof trpc.createDailyNorms.mutate>>['data']
>;

export type DailyNormItemEntity = DailyNormEntity['items'][number]
