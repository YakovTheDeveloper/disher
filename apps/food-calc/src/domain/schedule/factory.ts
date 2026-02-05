import { DaySchedule, ScheduleItem } from "@/domain/schedule/schedule.model"
import { mstEnv } from "@/store/store"
import { Instance } from "mobx-state-tree";

export const ScheduleFactory = {

    // createScheduleItemDraft(time: string, options?: { quantity?: number; content?: any }) {
    //     return ScheduleItem.create(
    //         {
    //             id: 'draft-food',
    //             quantity: options?.quantity ?? 100,
    //             time: time || '12:00',
    //             content: {
    //                 variant: 'product',
    //                 foodId: '0',
    //             }
    //         },
    //         mstEnv
    //     )
    // },

    createScheduleEventDraft(time: string, options?: { quantity?: number; content?: any }) {
        return ScheduleItem.create(
            {
                id: "DRAFT",
                time: '12:00',
                type: 'custom',
                value: ''
            },
            mstEnv
        )
    },

    createSchedule(overrides: Partial<Instance<typeof DaySchedule>> & { id: ISODate }) {
        const data = {
            id: overrides.id,
            userId: overrides.userId ?? 0,
            foods: {
                items: overrides.foods ?? []
            },
            events: {
                items: overrides.events ?? []
            },
            lastSync: ''
        }

        return DaySchedule.create(data)
    }

}
