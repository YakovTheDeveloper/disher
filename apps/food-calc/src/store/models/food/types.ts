import { getFoodList } from "@/api/food/food.api";

export type FoodEntity = NonNullable<
    Awaited<ReturnType<typeof getFoodList>>["data"]
>['items'][number];