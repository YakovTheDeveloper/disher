import { EventEmitter } from "@/lib/eventEmitter/eventEmitter";

export const NutrientsEventEmitter = new EventEmitter<"RECALCULATE_NUTRIENTS">()

export const ScheduleUIEventEmitter = new EventEmitter<"OPEN_COPY_SCHEDULE_MODAL">()