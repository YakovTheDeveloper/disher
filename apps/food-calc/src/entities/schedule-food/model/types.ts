import type { Entity, QueryResult } from "@triplit/client";
import type { schema } from "@triplit-schema/schema";

/** Base entity — no relations (foodId/dishId only, no .food/.dish) */
export type ScheduleFood = Entity<typeof schema, "scheduleFoods">;

/** With .Include("food").Include("dish") — has .food and .dish populated */
export type ScheduleFoodWithRelations = QueryResult<
  typeof schema,
  {
    collectionName: "scheduleFoods";
    include: { food: true; dish: true };
  }
>;

export type ScheduleFoodType = "food" | "dish";
