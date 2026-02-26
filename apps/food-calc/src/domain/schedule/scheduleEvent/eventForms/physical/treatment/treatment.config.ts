import { EventFormConfig } from '../../configs/types';
import { TREATMENT_SUBTYPES } from './types';

/**
 * Конфигурация формы лечения/реабилитации
 */
export const treatmentConfig: EventFormConfig = {
    eventType: 'treatment',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.treatment.subtype',
            options: TREATMENT_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип лечения' },
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.treatment.duration',
            validation: { min: 0, max: 4, required: false },
            defaultValue: '00:30',
        },
        {
            key: 'effectiveness',
            type: 'slider',
            labelKey: 'field.treatment.effectiveness',
            validation: { min: 1, max: 10 },
            defaultValue: 5,
            advanced: true,
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.treatment.notes',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'effectiveness', 'notes'],
};
