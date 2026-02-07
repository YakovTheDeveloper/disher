import { EventFormConfig } from '../../configs/types';
import { SOCIAL_SUBTYPES } from './types';

/**
 * Конфигурация формы социальных событий (communication)
 */
export const socialConfig: EventFormConfig = {
    eventType: 'social',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.social.subtype',
            options: SOCIAL_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип социальной активности' },
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.social.duration',
            validation: { min: 0, max: 12, required: false, errorMessage: 'Максимум 12 часов' },
            defaultValue: 60,
        },
        {
            key: 'quality',
            type: 'slider',
            labelKey: 'field.social.quality',
            validation: { min: 1, max: 10 },
            defaultValue: 5,
            advanced: true,
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.social.notes',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'quality', 'notes'],
};
