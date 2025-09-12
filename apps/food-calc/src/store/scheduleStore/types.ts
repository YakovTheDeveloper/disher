import { getOneSchedule } from "@/api/schedule/schedule.api";

export type ScheduleEntity = NonNullable<
    Awaited<ReturnType<typeof getOneSchedule>>["data"]
>;

export type ScheduleItemEntity = NonNullable<
    Awaited<ReturnType<typeof getOneSchedule>>["data"]
>['items'][number];
