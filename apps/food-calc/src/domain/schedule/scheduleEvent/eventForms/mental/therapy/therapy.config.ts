import { EventFormConfig } from '../../configs/types';
import { THERAPY_SUBTYPES } from './types';

/**
 * Конфигурация формы терапии/коучинга
 */
export const therapyConfig: EventFormConfig = {
    eventType: 'therapy',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.therapy.subtype',
            options: THERAPY_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип' },
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.therapy.duration',
            validation: { min: 0, max: 4, required: false },
            defaultValue: '01:00',
        },
        {
            key: 'effectiveness',
            type: 'slider',
            labelKey: 'field.therapy.effectiveness',
            validation: { min: 1, max: 10 },
            defaultValue: 7,
            advanced: true,
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.therapy.notes',
            validation: { maxLength: 300 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'effectiveness', 'notes'],
};
