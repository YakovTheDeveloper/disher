import { ScheduleEntity } from "@/store/scheduleStore/types";

export function getScheduleProductsByTime(schedule: ScheduleEntity, time: string) {
    return schedule.items.filter((item) => item.time === time)
}