import { EventFormConfig } from '../../configs/types';
import { MEDITATION_SUBTYPES } from './types';

/**
 * Конфигурация формы медитации
 */
export const meditationConfig: EventFormConfig = {
    eventType: 'meditation',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.meditation.subtype',
            options: MEDITATION_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип медитации' },
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.meditation.duration',
            validation: { min: 0, max: 2, required: false, errorMessage: 'Максимум 2 часа' },
            defaultValue: 15,
        },
        {
            key: 'depth',
            type: 'slider',
            labelKey: 'field.meditation.depth',
            validation: { min: 1, max: 10 },
            defaultValue: 5,
            advanced: true,
        },
        {
            key: 'guidance',
            type: 'select',
            labelKey: 'field.meditation.guidance',
            options: [
                { value: 'self', labelKey: 'guidance.self' },
                { value: 'guided', labelKey: 'guidance.guided' },
                { value: 'app', labelKey: 'guidance.app' },
            ],
            defaultValue: 'self',
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'depth', 'guidance'],
};
