import { EventFormConfig } from '../configs/types';
import { DIGITAL_SUBTYPES_TREE } from './types';

/**
 * Конфигурация формы цифровой среды
 */
export const digitalConfig: EventFormConfig = {
    eventType: 'digital',
    fields: [
        {
            key: 'subtype',
            type: 'tree',
            labelKey: 'field.digital.subtype',
            options: DIGITAL_SUBTYPES_TREE,
            validation: { required: true, errorMessage: 'Выберите тип' },
            maxDepth: 2,
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.digital.duration',
            validation: { min: 0, max: 12, required: false },
            defaultValue: '00:30',
            advanced: true,
        },
        {
            key: 'satisfaction',
            type: 'slider',
            labelKey: 'field.digital.satisfaction',
            validation: { min: 1, max: 10, required: false },
            defaultValue: 5,
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'satisfaction'],
};
