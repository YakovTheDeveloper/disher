import type { Entity } from "@triplit/client";
import type { schema } from "@triplit-schema/schema";
import type { Atom } from "./atoms";

// Override `atoms: any` (from S.Json()) with the actual typed union
export type ScheduleEvent = Omit<Entity<typeof schema, "scheduleEvents">, "atoms"> & {
  atoms: Atom[];
};

export type ScheduleEventType = "negative" | "positive" | "custom" | "routine" | "sport";
