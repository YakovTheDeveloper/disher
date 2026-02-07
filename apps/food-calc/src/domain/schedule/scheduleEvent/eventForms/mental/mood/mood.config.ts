import { EventFormConfig } from '../../configs/types';

/**
 * Конфигурация формы настроения
 */
export const moodConfig: EventFormConfig = {
    eventType: 'mood',
    fields: [
        {
            key: 'value',
            type: 'slider',
            labelKey: 'field.mood.value',
            validation: { min: 1, max: 10, required: true, errorMessage: 'Оценка от 1 до 10' },
            defaultValue: 5,
        },
        {
            key: 'factors',
            type: 'multiSelect',
            labelKey: 'field.mood.factors',
            options: [
                { value: 'sleep', labelKey: 'factor.sleep' },
                { value: 'weather', labelKey: 'factor.weather' },
                { value: 'social', labelKey: 'factor.social' },
                { value: 'work', labelKey: 'factor.work' },
                { value: 'health', labelKey: 'factor.health' },
                { value: 'exercise', labelKey: 'factor.exercise' },
            ],
            advanced: true,
        },
    ],
    serializedFields: ['value', 'factors'],
};
