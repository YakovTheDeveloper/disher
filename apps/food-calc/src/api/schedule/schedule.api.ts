import { extractChanges, filterAndRemoveStatus, noChildrenIdsIfString } from "@/api/adapters/common"
import { scheduleFromUI, normalizeFoodAndDishIds } from "@/api/schedule/schedule.adapter"
import { trpc } from "@/api/trpc/trpc"
import { ScheduleQuestionnaireItemUI } from "@/components/blocks/builders/food/ScheduleBuilder/EventsBuilder/viewModel/EventsBuilderViewModel"
import { DayScheduleUI } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel"
import { ISODate } from "@/types/common/common"
import type { ApiInputs } from '@types'
import { DailyEventData } from "@types";

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

    const filteredDailyEventItems = filterAndRemoveStatus(data.dailyEvents || [])

    const payload: Parameters<typeof trpc.addSchedule.mutate>[0] = {
        date: data.date,
        items,
        dailyEvents: filteredDailyEventItems.map(({ data, time }) => ({
            time,
            content: data
        })) ?? []
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
        const changes = extractChanges(data.items)
        payload.changes = changes
    }

    if (data.dailyEvents != undefined) {

        const filtered = filterAndRemoveStatus(data.dailyEvents)

        console.log('filtered', filtered);

        payload.dailyEvents = filtered.map(({ data, time }) => ({
            time,
            content: data
        }))
    }

    console.log("payload", payload);

    const result = await trpc.updateSchedule.mutate(payload)
    return result
}

// export const updateDailyEvents = async (
//     date: ISODate, payload: ScheduleQuestionnaireItemUI[]
// ) => {
//     const payload: Parameters<typeof trpc.updateScheduleDailyEvents.mutate>[0] = { id, items: data }

//     const result = await trpc.updateScheduleDailyEvents.mutate(payload)
//     return result
// }

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
