import { EventFormConfig } from '../../configs/types';

/**
 * Конфигурация формы сна
 */
export const sleepConfig: EventFormConfig = {
    eventType: 'sleep',
    fields: [
        {
            key: 'quality',
            type: 'slider',
            labelKey: 'field.sleep.quality',
            validation: { min: 1, max: 10, required: true, errorMessage: 'Оценка от 1 до 10' },
            defaultValue: 5,
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.sleep.duration',
            validation: { min: 0, max: 24, required: true, errorMessage: 'Максимум 24 часа' },
            defaultValue: 7,
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.sleep.notes',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['quality', 'duration', 'notes'],
};
