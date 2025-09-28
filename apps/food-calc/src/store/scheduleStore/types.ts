import { getOneSchedule } from "@/api/schedule/schedule.api";
import { DailyEvents } from '@types'

export type ScheduleEntity = NonNullable<
    Awaited<ReturnType<typeof getOneSchedule>>["data"]
>;

export type ScheduleItemEntity = NonNullable<
    Awaited<ReturnType<typeof getOneSchedule>>["data"]
>['items'][number];

export type DailyEventsEntity = Required<DailyEvents>