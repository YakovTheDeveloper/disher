import type { Entity } from "@triplit/client";
import type { schema } from "@triplit-schema/schema";

export type ScheduleFood = Entity<typeof schema, "scheduleFoods">;

export type ScheduleFoodType = "food" | "dish";
