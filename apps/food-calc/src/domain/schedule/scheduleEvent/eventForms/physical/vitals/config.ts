import { EventFormConfig } from '../../configs/types';
import { VITALS_SUBTYPES } from './types';

/**
 * Конфигурация формы измерений (vitals)
 */
export const vitalsConfig: EventFormConfig = {
    eventType: 'vitals',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.vitals.subtype',
            options: VITALS_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип измерения' },
        },
        {
            key: 'value',
            type: 'text',
            labelKey: 'field.vitals.value',
            validation: { required: true, minLength: 1, maxLength: 20, errorMessage: 'Введите значение' },
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.vitals.notes',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'value', 'notes'],
};
