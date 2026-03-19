import type { Entity } from "@triplit/client";
import type { schema } from "@triplit-schema/schema";

export type Product = Entity<typeof schema, "foods">;
export type ProductNutrient = Entity<typeof schema, "foodNutrients">;
export type ProductPortion = Entity<typeof schema, "foodPortions">;

export type ProductWithNutrients = Product & {
  nutrients?: Map<string, ProductNutrient>;
};
