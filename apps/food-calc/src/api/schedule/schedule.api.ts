import { filterAndRemoveStatus, noChildrenIdsIfString } from "@/api/adapters/common"
import { scheduleFromUI, normalizeFoodAndDishIds } from "@/api/schedule/schedule.adapter"
import { trpc } from "@/api/trpc/trpc"
import { DayScheduleUI } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel"
import { ISODate } from "@/types/common/common"
import type { ApiInputs } from '@types'

export const getSchedules = async (date: string) => {
    return trpc.getSchedules.query({ date })
}

export const getOneSchedule = async (data: { id: number, date?: ISODate } | { id?: number, date: ISODate }) => {
    return trpc.getOneSchedule.query(
        data
    )
}
// data: Omit<ScheduleEntity, 'id'>
export const addSchedule = async (data: DayScheduleUI) => {

    const schedule = scheduleFromUI(data)
    const normalizedIds = schedule.items.map(normalizeFoodAndDishIds);
    const items = filterAndRemoveStatus(normalizedIds)

    const payload: ApiInputs.ScheduleCreateWithoutUserInput = {
        date: data.date,
        items: {
            createMany: { data: items }
        }
    }

    const result = await trpc.addSchedule.mutate(payload);
    return result
}

export const updateSchedule = async (
    data: Partial<DayScheduleUI>,
    id: number
) => {
    const payload: Parameters<typeof trpc.updateSchedule.mutate>[0] = { id }

    if (data.date != undefined) {
        payload.date = data.date
    }
    if (data.items != undefined) {
        const normalizedIds = noChildrenIdsIfString(data.items)
        const statusFiltered = filterAndRemoveStatus(normalizedIds)
        const noStatus = statusFiltered.map(normalizeFoodAndDishIds)
        payload.items = noStatus
    }
    if (data.questionnaire != undefined) {
        payload.questionnaire = data.questionnaire
    }

    const result = await trpc.updateSchedule.mutate(payload)
    return result
}

// export const updateSchedule = async (
//     data: Partial<Omit<ScheduleEntity, 'id' | 'questionnaire'> & { questionnaire?: ScheduleQuestionnaire }>,
//     id: number
// ) => {
//     const payload: Parameters<typeof trpc.updateSchedule.mutate>[0] = { id }

//     if (data.date !== undefined) {
//         payload.date = data.date
//     }
//     if (data.items !== undefined) {
//         payload.items = mapScheduleItemsWithoutDraftIds(data.items)
//     }
//     if (data.questionnaire !== undefined) {
//         payload.questionnaire = data.questionnaire
//     }

//     const result = await trpc.updateSchedule.mutate(payload)
//     return result.data
// }
