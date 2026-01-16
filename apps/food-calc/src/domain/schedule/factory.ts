import { ScheduleItem } from "@/domain/schedule/schedule"
import { mstEnv } from "@/store/store"

export const createScheduleItemDraft = (time: string) => {
    return ScheduleItem.create(
        {
            id: 'draft-food',
            quantity: 100,
            time: time || '12:00',
            content: null,
        },
        mstEnv
    )
}