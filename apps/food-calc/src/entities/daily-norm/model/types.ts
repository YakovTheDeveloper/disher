import type { Entity } from "@triplit/client";
import type { schema } from "@triplit-schema/schema";

export type DailyNorm = Entity<typeof schema, "dailyNorms">;

/** Record<nutrientId, quantity> */
export type DailyNormItems = Record<string, number>;
