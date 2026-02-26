import { EventFormConfig } from '../../configs/types';
import { WORK_SOCIAL_SUBTYPES } from './types';

/**
 * Конфигурация формы рабочего социального взаимодействия
 */
export const workSocialConfig: EventFormConfig = {
    eventType: 'work_social',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.work_social.subtype',
            options: WORK_SOCIAL_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип' },
        },
        {
            key: 'intensity',
            type: 'slider',
            labelKey: 'field.work_social.intensity',
            validation: { min: 1, max: 10, required: false },
            defaultValue: 5,
            advanced: true,
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.work_social.notes',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'intensity', 'notes'],
};
