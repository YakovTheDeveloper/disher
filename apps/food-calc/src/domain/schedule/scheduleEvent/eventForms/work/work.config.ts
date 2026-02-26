import { EventFormConfig } from '../configs/types';
import { WORK_SUBTYPES_TREE } from './types';

/**
 * Конфигурация формы работы
 */
export const workConfig: EventFormConfig = {
    eventType: 'work',
    fields: [
        {
            key: 'subtype',
            type: 'tree',
            labelKey: 'field.work.subtype',
            options: WORK_SUBTYPES_TREE,
            validation: { required: true, errorMessage: 'Выберите тип работы' },
            maxDepth: 2,
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.work.duration',
            validation: { min: 0, max: 16, required: true, errorMessage: 'Укажите время' },
            defaultValue: '01:00',
        },
        {
            key: 'productivity',
            type: 'slider',
            labelKey: 'field.work.productivity',
            validation: { min: 1, max: 10, required: false },
            defaultValue: 7,
            advanced: true,
        },
        {
            key: 'context',
            type: 'text',
            labelKey: 'field.work.context',
            validation: { maxLength: 100 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'productivity', 'context'],
};
