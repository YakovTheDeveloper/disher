import { ScheduleEntity } from "@/store/scheduleStore/types";

export const mapScheduleItemsWithoutDraftIds = (items: ScheduleEntity['items']) => {
    return items.map(item => {
        if (typeof item.id === 'string') {
            const { id, ...rest } = item;
            return rest;
        }
        return item;
    });
}