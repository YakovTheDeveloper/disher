import { EventFormConfig } from '../../configs/types';
import { ILLNESS_SUBTYPES } from './types';

/**
 * Конфигурация формы болезни/недуга
 */
export const illnessConfig: EventFormConfig = {
    eventType: 'illness',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.illness.subtype',
            options: ILLNESS_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип недуга' },
        },
        {
            key: 'intensity',
            type: 'slider',
            labelKey: 'field.illness.intensity',
            validation: { min: 1, max: 10, required: true, errorMessage: 'Интенсивность от 1 до 10' },
            defaultValue: 5,
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.illness.notes',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'intensity', 'notes'],
};
