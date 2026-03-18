import type { Entity } from "@triplit/client";
import type { schema } from "@triplit-schema/schema";

export type DailyNorm = Entity<typeof schema, "dailyNorms">;
export type DailyNormItem = Entity<typeof schema, "dailyNormItems">;

export type DailyNormWithItems = DailyNorm & {
  items?: Map<string, DailyNormItem>;
};
