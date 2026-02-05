import { EventFormConfig } from '../../configs/types';

/**
 * Конфигурация формы энергии
 */
export const energyConfig: EventFormConfig = {
    eventType: 'energy',
    fields: [
        {
            key: 'value',
            type: 'slider',
            labelKey: 'field.energy.value',
            validation: { min: 1, max: 10, required: true, errorMessage: 'Оценка от 1 до 10' },
            defaultValue: 5,
        },
        {
            key: 'trend',
            type: 'select',
            labelKey: 'field.energy.trend',
            options: [
                { value: 'rising', labelKey: 'trend.rising' },
                { value: 'stable', labelKey: 'trend.stable' },
                { value: 'declining', labelKey: 'trend.declining' },
            ],
            defaultValue: 'stable',
            advanced: true,
        },
    ],
    serializedFields: ['value', 'trend'],
};
