import { types, flow, cast, Instance, getSnapshot, onPatch } from "mobx-state-tree"
import {
    getSchedules,
    getOneSchedule,
    addSchedule,
    updateSchedule,
    syncSchedule,
    syncSchedules
} from "@/api/schedule/schedule.api"
import { ISODate } from "@/types/common/common"
import { DaySchedule, ScheduleItem } from "@/domain/schedule/schedule.model"
import { createDayScheduleModel } from "@/store/DayScheduleStore/fabric"
import { createRequestController } from "@/store/common/pureFabrication/createRequestController"
import { StatusModel } from "@/store/common/pureFabrication/StatusModel"
import { ScheduleEventItem } from "@/domain/schedule/scheduleEvent/ScheduleEvent.model"
import { BaseEventType } from "@/domain/schedule/scheduleEvent/eventTypes"

// Default draft values
const DEFAULT_DRAFT_TIME = '12:00'
const MOST_USED_LIMIT = 5

export const DayScheduleStore = types
    .model("DayScheduleStore", {
        // Cache of schedules, keyed by date (ISO)
        data: types.map(DaySchedule),

        // Tracks if schedule exists on backend
        exists: types.map(types.boolean),

        // Request states per date
        status: types.optional(StatusModel, {
            fetchGet: {},
            fetchSync: {},
        }),

        // Draft state for foods and events
        foodDraft: types.optional(ScheduleItem, {
            id: "DRAFT",
            time: DEFAULT_DRAFT_TIME
        }),
        eventDraft: types.optional(ScheduleEventItem, {
            id: "DRAFT",
            time: DEFAULT_DRAFT_TIME,
            type: 'custom',
            data: null
        }),

        // Event usage statistics for "Most Often" feature
        eventUsageStats: types.map(types.number),

    })
    .views(self => ({
        getMostUsedEventTypes(): BaseEventType[] {
            const entries = Array.from(self.eventUsageStats.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, MOST_USED_LIMIT)
                .map(([type]) => type as BaseEventType)
            return entries
        },
    }))
    .actions(self => {
        // Helper to recalculate most used after stats change
        let _mostUsedCache: BaseEventType[] = []

        const recalculateMostUsed = () => {
            const entries = Array.from(self.eventUsageStats.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, MOST_USED_LIMIT)
                .map(([type]) => type as BaseEventType)
            _mostUsedCache = entries
        }

        return {
            // ======== EVENT USAGE STATS ========
            incrementEventUsage(type: BaseEventType) {
                const current = self.eventUsageStats.get(type) || 0
                self.eventUsageStats.set(type, current + 1)
                recalculateMostUsed()
            },

            getMostUsedEventTypes(): BaseEventType[] {
                return _mostUsedCache
            }
        }
    })

    // ======== HELPERS ========
    .actions(self => ({
        addLocal(init: Parameters<typeof createDayScheduleModel>[0]) {
            const model = createDayScheduleModel(init);
            self.data.set(model.id, model);
            return model
        },

        getEntity(date: ISODate) {
            return self.data.get(date)
        },

        fetchSync: async (payload: Instance<typeof DaySchedule>) => {
            const { id } = payload

            const syncRequest = createRequestController({
                getState: (id: string, variant: string) => self.status[variant].get(id)
            })

            const result = await syncRequest.run({
                id,
                variant: 'fetchSync'
            }, () => syncSchedules([payload]))

            return result

        },

        // ---- Local update (no backend call)
        updateDailyEventsLocal(date: ISODate, payload: string | null) {
            const item = self.data.get(date)
            if (!item) return
            item.dailyEvents = payload
        },

        // ---- Manual setters if needed
        set(date: ISODate, schedule: unknown) {
            self.data.set(date, cast(schedule))
        },

        getLocal(date: ISODate) {
            return self.data.get(date);
        },

        has(date: string) {
            return self.data.has(date);
        },

        delete(date: ISODate) {
            self.data.delete(date)
        },

        // ======== DRAFT METHODS ========
        clearFoodDraft() {
            self.foodDraft?.content.clear()
        },

        clearEventDraft() {
            self.eventDraft.time = DEFAULT_DRAFT_TIME
            self.eventDraft.type = 'custom'
            self.eventDraft.data = null
        },

        commitFoodDraft(schedule: Instance<typeof DaySchedule>): string {
            const snapshot = getSnapshot(self.foodDraft)
            const instance = schedule.foods.addChildWithLocalData(snapshot)
            self.clearFoodDraft()
            return instance.id
        },

        commitEventDraft(schedule: Instance<typeof DaySchedule>): string {
            const snapshot = getSnapshot(self.eventDraft)
            const instance = schedule.events.addChildWithLocalData(snapshot)
            self.clearEventDraft()
            return instance.id
        },
    }))
