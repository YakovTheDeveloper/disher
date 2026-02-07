import { EventFormConfig } from '../../configs/types';

/**
 * Конфигурация формы благодарности
 */
export const gratitudeConfig: EventFormConfig = {
    eventType: 'gratitude',
    fields: [
        {
            key: 'items',
            type: 'text',
            labelKey: 'field.gratitude.items',
            validation: { required: true, minLength: 1, maxLength: 500, errorMessage: 'За что вы благодарны?' },
        },
        {
            key: 'mood',
            type: 'slider',
            labelKey: 'field.gratitude.mood',
            validation: { min: 1, max: 10 },
            defaultValue: 5,
            advanced: true,
        },
    ],
    serializedFields: ['items', 'mood'],
};
