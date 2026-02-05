import { EventFormConfig } from '../../configs/types';

/**
 * Конфигурация формы фокуса/концентрации
 */
export const focusConfig: EventFormConfig = {
    eventType: 'focus',
    fields: [
        {
            key: 'value',
            type: 'slider',
            labelKey: 'field.focus.value',
            validation: { min: 1, max: 10, required: true, errorMessage: 'Оценка от 1 до 10' },
            defaultValue: 5,
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.focus.duration',
            validation: { min: 0, max: 12, required: false, errorMessage: 'Максимум 12 часов' },
            defaultValue: 25,
        },
        {
            key: 'distractions',
            type: 'steps',
            labelKey: 'field.focus.distractions',
            validation: { min: 0, max: 20 },
            defaultValue: 0,
            advanced: true,
        },
    ],
    serializedFields: ['value', 'duration', 'distractions'],
};
