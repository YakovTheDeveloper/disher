import { EventFormConfig } from '../../configs/types';
import { ONLINE_SUBTYPES } from './types';

/**
 * Конфигурация формы онлайн активности
 */
export const onlineConfig: EventFormConfig = {
    eventType: 'online',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.online.subtype',
            options: ONLINE_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип онлайн активности' },
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.online.duration',
            validation: { min: 0, max: 12, required: false, errorMessage: 'Максимум 12 часов' },
            defaultValue: 30,
        },
        {
            key: 'platform',
            type: 'text',
            labelKey: 'field.online.platform',
            validation: { maxLength: 50 },
            advanced: true,
        },
        {
            key: 'satisfaction',
            type: 'slider',
            labelKey: 'field.online.satisfaction',
            validation: { min: 1, max: 10 },
            defaultValue: 5,
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'platform', 'satisfaction'],
};
