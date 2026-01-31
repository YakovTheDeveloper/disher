import { ScheduleItem } from "@/domain/schedule/schedule.model"
import { mstEnv } from "@/store/store"

export const ScheduleFactory = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createScheduleItemDraft(time: string, options?: { quantity?: number; content?: any }) {
        return ScheduleItem.create(
            {
                id: 'draft-food',
                quantity: options?.quantity ?? 100,
                time: time || '12:00',
                content: options?.content ?? null,
            },
            mstEnv
        )
    }
}
