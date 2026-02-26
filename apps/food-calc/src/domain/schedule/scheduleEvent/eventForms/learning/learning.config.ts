import { EventFormConfig } from '../configs/types';
import { LEARNING_SUBTYPES_TREE } from './types';

/**
 * Конфигурация формы обучения и творчества
 */
export const learningConfig: EventFormConfig = {
    eventType: 'learning',
    fields: [
        {
            key: 'subtype',
            type: 'tree',
            labelKey: 'field.learning.subtype',
            options: LEARNING_SUBTYPES_TREE,
            validation: { required: true, errorMessage: 'Выберите тип' },
            maxDepth: 2,
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.learning.duration',
            validation: { min: 0, max: 12, required: true, errorMessage: 'Укажите время' },
            defaultValue: '01:00',
        },
        {
            key: 'engagement',
            type: 'slider',
            labelKey: 'field.learning.engagement',
            validation: { min: 1, max: 10, required: false },
            defaultValue: 7,
            advanced: true,
        },
        {
            key: 'notes',
            type: 'textarea',
            labelKey: 'field.learning.notes',
            validation: { maxLength: 500 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'engagement', 'notes'],
};
