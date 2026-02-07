import { EventFormConfig } from '../../configs/types';
import { STRESS_SUBTYPES } from './types';

/**
 * Конфигурация формы стресса
 */
export const stressConfig: EventFormConfig = {
    eventType: 'stress',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.stress.subtype',
            options: STRESS_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите источник стресса' },
        },
        {
            key: 'level',
            type: 'slider',
            labelKey: 'field.stress.level',
            validation: { min: 1, max: 10, required: true, errorMessage: 'Уровень от 1 до 10' },
            defaultValue: 5,
        },
        {
            key: 'coping',
            type: 'multiSelect',
            labelKey: 'field.stress.coping',
            options: [
                { value: 'exercise', labelKey: 'coping.exercise' },
                { value: 'meditation', labelKey: 'coping.meditation' },
                { value: 'talk', labelKey: 'coping.talk' },
                { value: 'rest', labelKey: 'coping.rest' },
                { value: 'distraction', labelKey: 'coping.distraction' },
            ],
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'level', 'coping'],
};
