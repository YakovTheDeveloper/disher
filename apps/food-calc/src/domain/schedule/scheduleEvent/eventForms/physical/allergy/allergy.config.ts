import { EventFormConfig } from '../../configs/types';
import { ALLERGY_SUBTYPES } from './types';

/**
 * Конфигурация формы аллергии
 */
export const allergyConfig: EventFormConfig = {
    eventType: 'allergy',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.allergy.subtype',
            options: ALLERGY_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип аллергии' },
        },
        {
            key: 'intensity',
            type: 'slider',
            labelKey: 'field.allergy.intensity',
            validation: { min: 1, max: 10, required: true, errorMessage: 'Интенсивность от 1 до 10' },
            defaultValue: 5,
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.allergy.notes',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'intensity', 'notes'],
};
