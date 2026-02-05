import { EventFormConfig } from '../../configs/types';
import { FAMILY_SUBTYPES } from './types';

/**
 * Конфигурация формы семейной активности
 */
export const familyConfig: EventFormConfig = {
    eventType: 'family',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.family.subtype',
            options: FAMILY_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип семейной активности' },
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.family.duration',
            defaultValue: 120,
            validation: { min: 0, max: 12, required: false, errorMessage: 'Максимум 12 часов' },
        },
        {
            key: 'mood',
            type: 'slider',
            labelKey: 'field.family.mood',
            validation: { min: 1, max: 10 },
            defaultValue: 5,
            advanced: true,
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.family.notes',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'mood', 'notes'],
};
