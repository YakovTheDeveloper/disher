import { EventFormConfig } from '../../configs/types';
import { RELAXATION_SUBTYPES } from './types';

/**
 * Конфигурация формы релаксации
 */
export const relaxationConfig: EventFormConfig = {
    eventType: 'relaxation',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.relaxation.subtype',
            options: RELAXATION_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип релаксации' },
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.relaxation.duration',
            validation: { min: 0, max: 4, required: false, errorMessage: 'Максимум 4 часа' },
            defaultValue: 30,
        },
        {
            key: 'effectiveness',
            type: 'slider',
            labelKey: 'field.relaxation.effectiveness',
            validation: { min: 1, max: 10 },
            defaultValue: 5,
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'effectiveness'],
};
