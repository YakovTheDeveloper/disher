import { SyncStatus } from "@/domain/commonListItem";
import { types } from "mobx-state-tree";
import {
    BaseEventType,
    EventSubtype,
    getEventTypeDefinition,
    hasSubtypes,
    getSubtypes,
    EVENT_TYPES
} from './eventTypes';
import {
    EventFormConfig,
    getEventFormConfig
} from './eventForms';
import { ScheduleEventFactory } from "@/domain/schedule/scheduleEvent/ScheduleEvent.factory";

/**
 * Тип события для обратной совместимости
 */
export type ScheduleEventType = BaseEventType;

/**
 * Получить отображаемое имя типа события
 */
function getEventTypeLabel(type: BaseEventType): string {
    const definition = getEventTypeDefinition(type);
    return definition.localizationKey;
}

export const ScheduleEventItem = types.model("ScheduleEventItem", {
    id: types.identifier,
    /** Данные события (объект, не сериализованная строка) */
    data: types.frozen(),
    time: types.string,
    sync: types.optional(SyncStatus, {}),
    type: types.union(
        // Physical
        types.literal('sleep'),
        types.literal('illness'),
        types.literal('digestion'),
        types.literal('medication'),
        types.literal('weight'),
        types.literal('vitals'),
        types.literal('hydration'),
        // Mental
        types.literal('mood'),
        types.literal('energy'),
        types.literal('stress'),
        types.literal('focus'),
        types.literal('anxiety'),
        types.literal('relaxation'),
        types.literal('meditation'),
        types.literal('creativity'),
        // Activity
        types.literal('sport'),
        types.literal('activity'),
        types.literal('hobby'),
        types.literal('chores'),
        types.literal('transport'),
        // Social
        types.literal('social'),
        types.literal('online'),
        types.literal('family'),
        types.literal('partner'),
        // Notes
        types.literal('note'),
        types.literal('custom'),
        types.literal('gratitude'),
        types.literal('idea'),
        types.literal('task'),
        types.literal('goal'),
    ),
    /** Путь выбора категории (массив от корня до выбранного листа) */
    subtype: types.optional(types.array(types.string), []),

}).views(self => ({
    get typeView() {
        return getEventTypeLabel(self.type);
    },
    get definition() {
        return getEventTypeDefinition(self.type);
    },
    get hasSubtypes(): boolean {
        return hasSubtypes(self.type);
    },
    get availableSubtypes(): EventSubtype[] {
        return getSubtypes(self.type);
    },
    get formConfig(): EventFormConfig {
        return getEventFormConfig(self.type);
    },
})).actions(self => ({
    updateTime(time: string) {
        self.time = time;
    },
    updateType(type: ScheduleEventType) {
        self.subtype.replace([]);
        self.type = type;
        self.data = ScheduleEventFactory.createEmptyEventData(type);
    },
    updateSubtype(subtype: string[]) {
        self.subtype.replace(subtype);
    },
    /**
     * Установить данные события
     */
    setData(data: Record<string, unknown> | null) {
        self.data = data;
    },
}));

/**
 * Получить все доступные типы событий
 */
export function getAllEventTypes(): ScheduleEventType[] {
    return Object.keys(EVENT_TYPES) as ScheduleEventType[];
}