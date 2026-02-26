import { EventFormConfig } from '../configs/types';
import { ENVIRONMENT_SUBTYPES_TREE } from './types';

/**
 * Конфигурация формы окружающей среды
 */
export const environmentConfig: EventFormConfig = {
    eventType: 'environment',
    fields: [
        {
            key: 'subtype',
            type: 'tree',
            labelKey: 'field.environment.subtype',
            options: ENVIRONMENT_SUBTYPES_TREE,
            validation: { required: true, errorMessage: 'Выберите тип' },
            maxDepth: 2,
        },
        {
            key: 'impact',
            type: 'slider',
            labelKey: 'field.environment.impact',
            validation: { min: 1, max: 10, required: false },
            defaultValue: 5,
            advanced: true,
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.environment.notes',
            validation: { maxLength: 100 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'impact', 'notes'],
};
