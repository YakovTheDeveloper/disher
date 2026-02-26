import { EventFormConfig } from '../../configs/types';
import { PAIN_SUBTYPES } from './types';

/**
 * Конфигурация формы боли
 */
export const painConfig: EventFormConfig = {
    eventType: 'pain',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.pain.subtype',
            options: PAIN_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип боли' },
        },
        {
            key: 'intensity',
            type: 'slider',
            labelKey: 'field.pain.intensity',
            validation: { min: 1, max: 10, required: true, errorMessage: 'Интенсивность от 1 до 10' },
            defaultValue: 5,
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.pain.notes',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'intensity', 'notes'],
};
