import { EventFormConfig } from '../../configs/types';
import { CREATIVITY_SUBTYPES } from './types';

/**
 * Конфигурация формы творчества
 */
export const creativityConfig: EventFormConfig = {
    eventType: 'creativity',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.creativity.subtype',
            options: CREATIVITY_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип творчества' },
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.creativity.duration',
            validation: { min: 0, max: 8, required: false, errorMessage: 'Максимум 8 часов' },
            defaultValue: 45,
        },
        {
            key: 'satisfaction',
            type: 'slider',
            labelKey: 'field.creativity.satisfaction',
            validation: { min: 1, max: 10 },
            defaultValue: 5,
            advanced: true,
        },
        {
            key: 'output',
            type: 'text',
            labelKey: 'field.creativity.output',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'satisfaction', 'output'],
};
