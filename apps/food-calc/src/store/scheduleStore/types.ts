import { getOneSchedule } from "@/api/schedule/schedule.api";
import { DailySurvey } from '@types'

export type ScheduleEntity = NonNullable<
    Awaited<ReturnType<typeof getOneSchedule>>["data"]
>;

export type ScheduleItemEntity = NonNullable<
    Awaited<ReturnType<typeof getOneSchedule>>["data"]
>['items'][number];

export type ScheduleQuestionnaire = Required<DailySurvey>