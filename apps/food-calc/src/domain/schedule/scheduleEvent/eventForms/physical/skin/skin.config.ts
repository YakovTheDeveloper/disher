import { EventFormConfig } from '../../configs/types';
import { SKIN_SUBTYPES } from './types';

/**
 * Конфигурация формы состояния кожи
 */
export const skinConfig: EventFormConfig = {
    eventType: 'skin',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.skin.subtype',
            options: SKIN_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип проблемы' },
        },
        {
            key: 'severity',
            type: 'slider',
            labelKey: 'field.skin.severity',
            validation: { min: 1, max: 10, required: true, errorMessage: 'Выраженность от 1 до 10' },
            defaultValue: 5,
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.skin.notes',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'severity', 'notes'],
};
