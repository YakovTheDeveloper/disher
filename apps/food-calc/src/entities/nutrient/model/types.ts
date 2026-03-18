import type { Entity } from "@triplit/client";
import type { schema } from "@triplit-schema/schema";

export type Nutrient = Entity<typeof schema, "nutrients">;
