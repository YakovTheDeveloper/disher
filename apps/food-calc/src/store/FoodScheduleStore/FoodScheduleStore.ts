import { types, cast, Instance, getSnapshot } from "mobx-state-tree"
import { syncSchedules } from "@/api/schedule/schedule.api"
import { ISODate } from "@/types/common/common"
import { ScheduleFoods, ScheduleFoodsItem, ScheduleFoodsItemType } from "@/domain/schedule/scheduleFood/ScheduleFoods.model"
import { createFoodScheduleModel } from "@/store/FoodScheduleStore/fabric"
import { createRequestController } from "@/store/common/pureFabrication/createRequestController"
import { ScheduleTime } from "@/store/common/ScheduleTime.model"
import { ChildrenController } from "@/domain/shared/ChildrenController"

const DEFAULT_DRAFT_TIME = '12:00'

export const FoodScheduleStore = types
    .model("FoodScheduleStore", {
        data: types.map(ScheduleFoods),
        foodDraft: types.optional(ScheduleFoodsItem, {
            id: "DRAFT",
            time: DEFAULT_DRAFT_TIME
        }),
    })
    .views(self => ({
        getLocal(date: ISODate) {
            return self.data.get(date)
        },

        has(date: string) {
            return self.data.has(date)
        },
    }))
    .actions(self => ({
        addLocal(init: Parameters<typeof createFoodScheduleModel>[0]) {
            const model = createFoodScheduleModel(init)
            self.data.set(model.id, model)
            return model
        },

        set(date: ISODate, schedule: Instance<typeof ScheduleFoods>) {
            self.data.set(date, schedule)
        },

        delete(date: ISODate) {
            self.data.delete(date)
        },

        clearFoodDraft() {
            self.foodDraft?.clear()
        },

        commitFoodDraft(scheduleId: string): string {
            const schedule = self.data.get(scheduleId)
            if (!schedule) {
                throw new Error(`Schedule with id ${scheduleId} not found`)
            }
            const snapshot = getSnapshot(self.foodDraft)
            const instance = schedule.foods.addChildWithLocalData(snapshot)
            self.clearFoodDraft()
            return instance.id
        },

        updateDailyEventsLocal(date: ISODate, payload: string | null) {
            const item = self.data.get(date)
            if (!item) return
            const schedule = item as any
            schedule.dailyEvents = payload
        },

        getScheduleChildById(scheduleId: string, itemId: string): ScheduleFoodsItemType | null | undefined {
            if (itemId === 'draft') {
                return self.foodDraft
            }

            const schedule = self.data.get(scheduleId)
            if (!schedule) return null

            return schedule.getChildById(itemId)
        },

    }))
