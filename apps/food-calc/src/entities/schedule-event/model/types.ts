import type { Entity } from "@triplit/client";
import type { schema } from "@triplit-schema/schema";

export type ScheduleEvent = Entity<typeof schema, "scheduleEvents">;

export type ScheduleEventType = "negative" | "positive" | "custom" | "routine" | "sport";
