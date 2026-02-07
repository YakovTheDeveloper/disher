import { EventFormConfig } from '../../configs/types';
import { DIGESTION_SUBTYPES } from './types';

/**
 * Конфигурация формы пищеварения
 */
export const digestionConfig: EventFormConfig = {
    eventType: 'digestion',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.digestion.subtype',
            options: DIGESTION_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите симптом' },
        },
        {
            key: 'intensity',
            type: 'slider',
            labelKey: 'field.digestion.intensity',
            validation: { min: 1, max: 10, required: true, errorMessage: 'Интенсивность от 1 до 10' },
            defaultValue: 5,
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.digestion.notes',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'intensity', 'notes'],
};
