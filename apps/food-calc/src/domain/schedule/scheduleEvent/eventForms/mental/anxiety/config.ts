import { EventFormConfig } from '../../configs/types';
import { ANXIETY_SUBTYPES } from './types';

/**
 * Конфигурация формы тревожности
 */
export const anxietyConfig: EventFormConfig = {
    eventType: 'anxiety',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.anxiety.subtype',
            options: ANXIETY_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип тревоги' },
        },
        {
            key: 'level',
            type: 'slider',
            labelKey: 'field.anxiety.level',
            validation: { min: 1, max: 10, required: true, errorMessage: 'Уровень от 1 до 10' },
            defaultValue: 5,
        },
        {
            key: 'triggers',
            type: 'text',
            labelKey: 'field.anxiety.triggers',
            validation: { maxLength: 200 },
            advanced: true,
        },
        {
            key: 'relief',
            type: 'text',
            labelKey: 'field.anxiety.relief',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'level', 'triggers', 'relief'],
};
