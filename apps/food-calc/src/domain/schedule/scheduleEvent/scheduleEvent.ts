import { SyncStatus } from "@/domain/commonListItem";
import { types } from "mobx-state-tree";
import {
    BaseEventType,
    EventSubtype,
    EVENT_TYPES,
    getEventTypeDefinition,
    hasSubtypes,
    getSubtypes
} from './eventTypes';
import {
    EventData,
    EventFormConfig,
    getEventFormConfig,
    serializeEvent,
    deserializeEvent,
    createEmptyEventData,
    validateEventForm
} from './eventForms';

/**
 * Тип события для обратной совместимости
 */
export type ScheduleEventType = BaseEventType;

/**
 * Получить отображаемое имя типа события
 */
function getEventTypeLabel(type: BaseEventType): string {
    const definition = getEventTypeDefinition(type);
    // Здесь должна быть локализация, пока возвращаем ключ
    return definition.localizationKey;
}

export const EventItem = types.model("EventItem", {
    id: types.identifier,
    value: types.string,
    time: types.string,
    sync: types.optional(SyncStatus, {}),
    type: types.union(
        types.literal('sleep'),
        types.literal('mood'),
        types.literal('energy'),
        types.literal('custom'),
        types.literal('sport'),
        types.literal('illness'),
        types.literal('note'),
        types.literal('activity'),
        types.literal('digestion'),
        types.literal('stress'),
        types.literal('focus'),
        types.literal('medication'),
        types.literal('social'),
    ),
    // Опциональный подтип для событий с вариациями
    subtype: types.optional(types.maybe(types.string), undefined),
    // Кэш десериализованных данных для UI
    _dataCache: types.optional(types.frozen(), null),

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
    /**
     * Получить десериализованные данные события
     */
    get data(): EventData | null {
        if (!self.value && !self.subtype) {
            return createEmptyEventData(self.type);
        }

        try {
            // Пытаемся десериализовать из value
            if (self.value) {
                return deserializeEvent(self.value);
            }
            // Если есть subtype, создаём данные вручную
            if (self.subtype) {
                return { type: self.type, subtype: self.subtype as EventSubtype };
            }
        } catch (error) {
            console.error('Error deserializing event:', error);
        }

        return createEmptyEventData(self.type);
    },
}))
    .actions(self => ({
        updateTime(time: string) {
            self.time = time;
        },
        updateValue(value: string) {
            self.value = value;
            // Сбрасываем кэш при изменении value
            self._dataCache = null;
        },
        updateType(type: ScheduleEventType) {
            self.type = type;
            self.subtype = undefined;
            self.value = '';
            self._dataCache = null;
        },
        /**
         * Обновить подтип события
         */
        updateSubtype(subtype: EventSubtype | undefined) {
            self.subtype = subtype;
            // Обновляем value с новым subtype
            const currentData = this.getCurrentData();
            if (currentData) {
                currentData.subtype = subtype;
                self.value = serializeEvent(currentData);
            }
        },
        /**
         * Обновить поле данных события
         */
        updateDataField(field: string, fieldValue: number | string | undefined) {
            const currentData = this.getCurrentData();
            if (currentData) {
                (currentData as Record<string, unknown>)[field] = fieldValue;
                self.value = serializeEvent(currentData);
            }
        },
        /**
         * Получить текущие данные события
         */
        getCurrentData(): EventData | null {
            if (self.value) {
                try {
                    return deserializeEvent(self.value);
                } catch {
                    return createEmptyEventData(self.type);
                }
            }
            return createEmptyEventData(self.type);
        },
        /**
         * Установить данные события из объекта
         */
        setData(data: EventData) {
            self.value = serializeEvent(data);
            if (data.subtype) {
                self.subtype = data.subtype;
            }
            self._dataCache = null;
        },
        /**
         * Валидировать форму события
         */
        validate(): { isValid: boolean; errors: Record<string, string> } {
            const data = this.getCurrentData();
            if (!data) {
                return { isValid: false, errors: { _form: 'Не удалось получить данные формы' } };
            }
            return validateEventForm(data);
        },
    }));

/**
 * Отображение типов событий для обратной совместимости
 */
export const EventTypeView: Record<ScheduleEventType, string> = {
    sleep: 'Сон',
    mood: 'Настроение',
    energy: 'Энергия',
    custom: 'Кастомное событие',
    sport: 'Спорт',
    illness: 'Самочувствие',
    note: 'Заметка',
    activity: 'Активность',
    digestion: 'Пищеварение',
    stress: 'Стресс',
    focus: 'Концентрация',
    medication: 'Лекарства',
    social: 'Социальная активность',
};

/**
 * Карта соответствия старых типов новым (для миграции)
 */
export const LEGACY_TYPE_MAP: Record<string, ScheduleEventType> = {
    // Старые типы остаются без изменений
    sleep: 'sleep',
    mood: 'mood',
    energy: 'energy',
    custom: 'custom',
    sport: 'sport',
    illness: 'illness',
    note: 'note',
    activity: 'activity',
    digestion: 'digestion',
    // Новые типы
    stress: 'stress',
    focus: 'focus',
    medication: 'medication',
    social: 'social',
};

/**
 * Проверить, является ли тип поддерживаемым
 */
export function isValidEventType(type: string): type is ScheduleEventType {
    return type in LEGACY_TYPE_MAP;
}

/**
 * Получить все доступные типы событий
 */
export function getAllEventTypes(): ScheduleEventType[] {
    return Object.keys(LEGACY_TYPE_MAP) as ScheduleEventType[];
}