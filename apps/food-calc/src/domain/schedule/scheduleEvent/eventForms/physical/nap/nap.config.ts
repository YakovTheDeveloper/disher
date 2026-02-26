import { EventFormConfig } from '../../configs/types';
import { NAP_SUBTYPES } from './types';

/**
 * Конфигурация формы дневного сна
 */
export const napConfig: EventFormConfig = {
    eventType: 'nap',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.nap.subtype',
            options: NAP_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип сна' },
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.nap.duration',
            validation: { min: 0, max: 4, required: true, errorMessage: 'Укажите продолжительность' },
            defaultValue: '00:20',
        },
        {
            key: 'quality',
            type: 'slider',
            labelKey: 'field.nap.quality',
            validation: { min: 1, max: 10, required: false },
            defaultValue: 7,
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'quality'],
};
