import type { Entity } from "@triplit/client";
import type { schema } from "@triplit-schema/schema";

export type Dish = Entity<typeof schema, "dishes">;
export type DishItem = Entity<typeof schema, "dishItems">;

export type DishWithItems = Dish & {
  items?: Map<string, DishItem>;
};
