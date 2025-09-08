import { mapScheduleItemsWithoutDraftIds } from "@/api/schedule/schedule.transform"
import { trpc } from "@/api/trpc/trpc"
import { ScheduleEntity } from "@/store/scheduleStore/types"
import type { ApiInputs } from '@types'

export const getSchedules = async (date: string) => {
    return trpc.getSchedules.query({ date })
}

export const getOneSchedule = async (id: number) => {
    return trpc.getOneSchedule.query({ id })
}

export const addSchedule = async (data: Omit<ScheduleEntity, 'id'>) => {

    const sanitizedItems = mapScheduleItemsWithoutDraftIds(data.items)

    const payload: ApiInputs.ScheduleCreateWithoutUserInput = {
        date: data.date,
        items: {
            createMany: { data: sanitizedItems }
        }
    }
    const result = await trpc.addSchedule.mutate(payload);
    return result.data
}

export const updateSchedule = async (data: Omit<ScheduleEntity, 'id'>, id: number) => {
    const { date, items } = data

    const sanitizedItems = mapScheduleItemsWithoutDraftIds(items)

    const result = await trpc.updateSchedule.mutate({ id, date, items: sanitizedItems });
    return result.data
}