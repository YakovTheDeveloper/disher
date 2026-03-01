import { ScheduleEvent } from "@/domain/schedule/scheduleEvent/ScheduleEvent.model";
import { generateId } from "@/lib/id/generateId";
import { StoreEntityFactory } from "@/store/types/factory";
import { SnapshotIn } from "mobx-state-tree";

/**
 * Factory for creating ScheduleEventItem instances
 * Now works with atomic events instead of type-based events
 */
export const ScheduleEventFactory: StoreEntityFactory<typeof ScheduleEvent> = {

    /**
     * Create a new event from local data
     */
    createNewLocal(data: Omit<SnapshotIn<typeof ScheduleEvent>, 'id'>) {
        try {
            return ScheduleEvent.create({
                ...data,
                id: generateId(),
                createdAt: Date.now(),
                atoms: data.atoms || [],
            });
        } catch (error) {
            console.error('createNewLocal failed', error);
            throw error;
        }
    },

    /**
     * Create an event from server data
     */
    createFromServerData(data: SnapshotIn<typeof ScheduleEvent>) {
        return ScheduleEvent.create({
            ...data,
            id: data.id,
            createdAt: data.createdAt || Date.now(),
            atoms: data.atoms || [],
        });
    },
};

/**
 * Helper function to create an empty event
 */
export function createEmptyEvent(): SnapshotIn<typeof ScheduleEvent> {
    return {
        id: generateId(),
        text: "",
        createdAt: Date.now(),
        atoms: [],
    };
}