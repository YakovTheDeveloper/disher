import { EventFormConfig } from '../../configs/types';
import { FEMALE_HEALTH_SUBTYPES } from './types';

/**
 * Конфигурация формы женского здоровья
 */
export const femaleHealthConfig: EventFormConfig = {
    eventType: 'female_health',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.female_health.subtype',
            options: FEMALE_HEALTH_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип события' },
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.female_health.notes',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'notes'],
};
