import { getFood } from "@/api/food/food.api";

export type FoodEntity = NonNullable<
    Awaited<ReturnType<typeof getFood>>["data"]
>[number];