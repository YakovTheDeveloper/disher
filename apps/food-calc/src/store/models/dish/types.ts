import { getOneDish } from "@/api/dish/dish.api";

export type DishEntity = NonNullable<
    Awaited<ReturnType<typeof getOneDish>>["data"]
>;

export type DishItemEntity = NonNullable<
    Awaited<ReturnType<typeof getOneDish>>["data"]
>['items'][number];