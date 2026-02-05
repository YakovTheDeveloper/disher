import { BaseEventType, EventSubtype } from '../../eventTypes';
import { EventData, EventFormConfig } from './types';
import { EVENT_FORMS } from '../eventFormsMap';

/**
 * Получить конфигурацию формы для типа события
 */
export function getEventFormConfig(type: BaseEventType): EventFormConfig {
    return EVENT_FORMS[type];
}

/**
 * Сериализовать данные события в строку для сервера
 * Формат: "type|subtype|field1|field2|..."
 */
export function serializeEvent(data: EventData): string {
    const parts: string[] = [data.type];

    if (data.subtype && data.subtype.length > 0) {
        parts.push(JSON.stringify(data.subtype));
    }

    // Добавляем остальные поля в порядке, определённом в formConfig
    const formConfig = getEventFormConfig(data.type);

    for (const fieldKey of formConfig.serializedFields) {
        if (fieldKey === 'subtype' || fieldKey === 'type') continue;

        const value = data[fieldKey];
        if (value !== undefined && value !== null) {
            parts.push(String(value));
        } else {
            parts.push('');
        }
    }

    return parts.join('|');
}

/**
 * Десериализовать строку с сервера в данные события
 */
export function deserializeEvent(serialized: string): EventData {
    const parts = serialized.split('|');

    if (parts.length === 0) {
        throw new Error('Invalid serialized event format');
    }

    const type = parts[0] as BaseEventType;
    const formConfig = getEventFormConfig(type);

    const data: EventData = { type };

    // subtype - JSON массив после типа
    if (formConfig.fields.some(f => f.key === 'subtype') && parts.length > 1) {
        try {
            data.subtype = JSON.parse(parts[1]);
        } catch {
            data.subtype = [];
        }
    } else {
        data.subtype = [];
    }

    // Остальные поля
    const serializedFields = formConfig.serializedFields.filter(f => f !== 'subtype');
    let partIndex = formConfig.fields.some(f => f.key === 'subtype') ? 2 : 1;

    for (const fieldKey of serializedFields) {
        if (partIndex < parts.length) {
            const value = parts[partIndex];
            // Попытка преобразовать в число, если возможно
            data[fieldKey] = value === '' ? undefined : (isNaN(Number(value)) ? value : Number(value));
        }
        partIndex++;
    }

    return data;
}
