import { scheduleFromUI, normalizeFoodAndDishIds, noChildrenIdsIfString } from "@/api/schedule/schedule.adapter"
import { trpc } from "@/api/trpc/trpc"
import { DayScheduleUI } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel"
import { ScheduleEntity, ScheduleQuestionnaire } from "@/store/scheduleStore/types"
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
    const children = schedule.items.map(normalizeFoodAndDishIds);

    const payload: ApiInputs.ScheduleCreateWithoutUserInput = {
        date: data.date,
        items: {
            createMany: { data: children }
        }
    }

    const payload2 = {
        "date": "2025-09-17T20:00:00.000Z",
        "items": {
            "createMany": {
                "data": [
                    {
                        "customFoodName": "",
                        "quantity": 100,
                        "time": "08:00",
                        "foodId": 2
                    },
                    {
                        "customFoodName": "",
                        "quantity": 100,
                        "time": "08:30",
                        "foodId": 6
                    }
                ]
            }
        }
    }

    console.log(payload, payload2);

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
        const items = noChildrenIdsIfString(data.items)
        payload.items = items.map(normalizeFoodAndDishIds)
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
