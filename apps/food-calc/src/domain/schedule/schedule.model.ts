import { types, Instance } from "mobx-state-tree";
import { ChildrenController } from "@/domain/shared/ChildrenController";
import { groupItemsByTime } from "@/domain/schedule/schedule.service";
import { ScheduleEvent } from "@/domain/schedule/scheduleEvent/ScheduleEvent.model";
import { ScheduleFoods, ScheduleFoodsItem } from "./scheduleFood/ScheduleFoods.model";

// Re-export for backward compatibility
export { ScheduleFoodsItem as ScheduleFoodItem, ScheduleFoods as ScheduleFood };
export { ScheduleEvent };
export type { ScheduleItemType } from "./scheduleFood/ScheduleFoods.model";

export const ScheduleEventContainer = types.model({
    id: types.identifier,
    userId: types.number,
    lastSync: types.optional(types.string, ""),
    lastTimeEventAdded: types.optional(types.string, ""),
    events: ChildrenController(ScheduleEvent),
})
    .views(self => ({
        get isNoDailyEventItems() {
            return self.events?.items?.length === 0
        },
        get eventsGroupedByTime() {
            return groupItemsByTime(self.events.items);
        }
    }))
    .actions(self => {
        function updateEventTime(id: string, time: string) {
            self.events.updateChildById({ id, time });
        }

        function addOrUpdateEvent(itemId: string | null, state: { text?: string, atoms: any[], time: string }) {
            const { text, atoms, time } = state;

            if (!itemId) {
                self.events.addChildWithLocalData({
                    id: Math.random().toString(),
                    text: text || "",
                    createdAt: Date.now(),
                    atoms: atoms || [],
                    time: time || "",
                });
                return;
            }

            const event = self.events.items.find(e => e.id === itemId);
            if (event) {
                event.setText(text || "");
                event.clearAtoms();
                atoms.forEach(atom => event.addAtom(atom));
            }
        }

        return {
            updateEventTime,
            addOrUpdateEvent,
        };
    })
