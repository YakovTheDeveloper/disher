import { types, cast, Instance, getSnapshot } from "mobx-state-tree"
import { ISODate } from "@/types/common/common"
import { ScheduleEventContainer } from "@/domain/schedule/schedule.model"
import { ScheduleEvent } from "@/domain/schedule/scheduleEvent/ScheduleEvent.model"
import { createEmptyEvent } from "@/domain/schedule/scheduleEvent/ScheduleEvent.factory"
import { TagAtom } from "@/domain/schedule/scheduleEvent/atom.types"

const POPULAR_TAGS_LIMIT = 10
const MAX_TAG_HISTORY = 100

const parseTagHistory = (json: string): string[] => {
    try {
        return JSON.parse(json)
    } catch {
        return []
    }
}

const parseTagFrequency = (json: string): Record<string, number> => {
    try {
        return JSON.parse(json)
    } catch {
        return {}
    }
}

export const EventScheduleStore = types
    .model("EventScheduleStore", {
        data: types.map(ScheduleEventContainer),
        eventDraft: types.optional(ScheduleEvent, {
            id: "DRAFT",
            text: "",
            createdAt: Date.now(),
            atoms: []
        }),
        tagHistory: types.optional(types.string, "[]"),
        tagFrequency: types.optional(types.string, "{}"),
    })
    .views(self => ({
        getPopularTags(): string[] {
            const frequency = parseTagFrequency(self.tagFrequency)
            return Object.entries(frequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, POPULAR_TAGS_LIMIT)
                .map(([tag]) => tag)
        },

        getRecentTags(): string[] {
            const history = parseTagHistory(self.tagHistory)
            return history.reverse().slice(0, POPULAR_TAGS_LIMIT)
        },

        getLocal(date: ISODate) {
            return self.data.get(date)
        },

        has(date: string) {
            return self.data.has(date)
        },
    }))
    .actions(self => ({
        addLocal(init: { id: ISODate; userId?: number }) {
            const model = ScheduleEventContainer.create({
                id: init.id,
                userId: init.userId ?? 0,
                events: { items: [] },
                lastSync: ''
            })
            self.data.set(model.id, model)
            return model
        },

        set(date: ISODate, schedule: Instance<typeof ScheduleEventContainer>) {
            self.data.set(date, schedule)
        },

        delete(date: ISODate) {
            self.data.delete(date)
        },

        recordTagUsage(tag: string) {
            if (!tag || tag.trim().length === 0) return

            const frequency = parseTagFrequency(self.tagFrequency)
            frequency[tag] = (frequency[tag] || 0) + 1
            self.tagFrequency = JSON.stringify(frequency)

            let history = parseTagHistory(self.tagHistory)
            history = history.filter(t => t !== tag)
            history.push(tag)
            if (history.length > MAX_TAG_HISTORY) {
                history = history.slice(-MAX_TAG_HISTORY)
            }
            self.tagHistory = JSON.stringify(history)
        },

        clearTagHistory() {
            self.tagHistory = "[]"
            self.tagFrequency = "{}"
        },

        clearEventDraft() {
            const emptyEvent = createEmptyEvent()
            self.eventDraft = cast(emptyEvent)
        },

        commitEventDraft(scheduleId: string): string {
            const schedule = self.data.get(scheduleId)
            if (!schedule) {
                throw new Error(`Schedule with id ${scheduleId} not found`)
            }

            const tagAtoms = self.eventDraft.atoms.filter(a => a.kind === 'tag')
            tagAtoms.forEach(atom => {
                self.recordTagUsage((atom as TagAtom).value)
            })

            const snapshot = getSnapshot(self.eventDraft)
            const instance = schedule.events.addChildWithLocalData(snapshot)
            self.clearEventDraft()
            return instance.id
        },

        getScheduleChildById(scheduleId: string, itemId: string) {
            const schedule = self.data.get(scheduleId)
            if (!schedule) return null

            if (itemId === 'draft') {
                return self.eventDraft
            }
            return null
        },
    }))
