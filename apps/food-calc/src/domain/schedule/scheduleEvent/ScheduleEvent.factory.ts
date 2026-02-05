import { EventData, getEventFormConfig } from "@/domain/schedule/scheduleEvent/eventForms";
import { BaseEventType } from "@/domain/schedule/scheduleEvent/eventTypes";
import { ScheduleEventItem } from "@/domain/schedule/scheduleEvent/ScheduleEvent.model";
import { generateId } from "@/lib/id/generateId";
import { StoreEntityFactory } from "@/store/types/factory";
import { SnapshotIn } from "mobx-state-tree";

export const ScheduleEventFactory: StoreEntityFactory<typeof ScheduleEventItem> & {
    createEmptyEventData(type: BaseEventType): EventData
} = {

    createNewLocal(data: Omit<SnapshotIn<typeof ScheduleEventItem>, 'id'>) {
        try {
            // Извлекаем subtype из data, если он там есть
            const { subtype, ...restData } = data.data as Record<string, unknown> || {};

            return ScheduleEventItem.create({
                ...data,
                id: generateId(),
                subtype: subtype as string[] || [],
                data: restData,
            });
        } catch (error) {
            console.error('createNewLocal failed', error);
            throw error;
        }
    },

    createFromServerData(data: SnapshotIn<typeof ScheduleEventItem>) {

    },

    createEmptyEventData(type: BaseEventType): EventData {
        const formConfig = getEventFormConfig(type);
        const data: EventData = { type };

        for (const field of formConfig.fields) {
            if (field.defaultValue !== undefined) {
                data[field.key] = field.defaultValue;
                continue;
            }

            switch (field.type) {
                case 'text':
                    data[field.key] = '';
                    break;
                case 'slider':
                case 'steps':
                    data[field.key] = field.validation?.min ?? 0;
                    break;
                case 'duration':
                    data[field.key] = 30;
                    break;
                case 'time':
                    data[field.key] = '12:00';
                    break;
                case 'select':
                    data[field.key] = field.options?.[0]?.value ?? undefined;
                    break;
                case 'multiSelect':
                    data[field.key] = [];
                    break;
                case 'tree':
                    data[field.key] = [];
                    break;
                case 'quick-buttons':
                    data[field.key] = undefined;
                    break;
            }
        }

        return data;
    }

}