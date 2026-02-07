import { EventFormConfig } from '../../configs/types';
import { PARTNER_SUBTYPES } from './types';

/**
 * Конфигурация формы партнёрской активности
 */
export const partnerConfig: EventFormConfig = {
    eventType: 'partner',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.partner.subtype',
            options: PARTNER_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип активности с партнёром' },
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.partner.duration',
            defaultValue: 60,
            validation: { min: 0, max: 12, required: false, errorMessage: 'Максимум 12 часов' },
        },
        {
            key: 'quality',
            type: 'slider',
            labelKey: 'field.partner.quality',
            validation: { min: 1, max: 10 },
            defaultValue: 5,
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.partner.notes',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'quality', 'notes'],
};
