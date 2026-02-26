import { EventFormConfig } from '../../configs/types';
import { MOTIVATION_SUBTYPES } from './types';

/**
 * Конфигурация формы мотивации
 */
export const motivationConfig: EventFormConfig = {
    eventType: 'motivation',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.motivation.subtype',
            options: MOTIVATION_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип' },
        },
        {
            key: 'level',
            type: 'slider',
            labelKey: 'field.motivation.level',
            validation: { min: 1, max: 10, required: true, errorMessage: 'Уровень от 1 до 10' },
            defaultValue: 5,
        },
        {
            key: 'related_goal',
            type: 'text',
            labelKey: 'field.motivation.related_goal',
            validation: { maxLength: 100 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'level', 'related_goal'],
};
