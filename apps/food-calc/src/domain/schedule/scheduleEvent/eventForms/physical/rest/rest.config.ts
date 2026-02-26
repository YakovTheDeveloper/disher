import { EventFormConfig } from '../../configs/types';
import { REST_SUBTYPES } from './types';

/**
 * Конфигурация формы отдыха
 */
export const restConfig: EventFormConfig = {
    eventType: 'rest',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.rest.subtype',
            options: REST_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип отдыха' },
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.rest.duration',
            validation: { min: 0, max: 8, required: true, errorMessage: 'Укажите продолжительность' },
            defaultValue: '00:30',
        },
        {
            key: 'relaxation_level',
            type: 'slider',
            labelKey: 'field.rest.relaxation_level',
            validation: { min: 1, max: 10, required: false },
            defaultValue: 7,
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'relaxation_level'],
};
