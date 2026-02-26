import { EventFormConfig } from '../../configs/types';
import { ANGER_SUBTYPES } from './types';

/**
 * Конфигурация формы гнева/внутреннего конфликта
 */
export const angerConfig: EventFormConfig = {
    eventType: 'anger',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.anger.subtype',
            options: ANGER_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип' },
        },
        {
            key: 'intensity',
            type: 'slider',
            labelKey: 'field.anger.intensity',
            validation: { min: 1, max: 10, required: true, errorMessage: 'Интенсивность от 1 до 10' },
            defaultValue: 5,
        },
        {
            key: 'trigger',
            type: 'text',
            labelKey: 'field.anger.trigger',
            validation: { maxLength: 200 },
            advanced: true,
        },
        {
            key: 'coping',
            type: 'multiSelect',
            labelKey: 'field.anger.coping',
            options: [
                { value: 'breathing', labelKey: 'coping.breathing' },
                { value: 'exercise', labelKey: 'coping.exercise' },
                { value: 'talk', labelKey: 'coping.talk' },
                { value: 'writing', labelKey: 'coping.writing' },
                { value: 'accepted', labelKey: 'coping.accepted' },
            ],
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'intensity', 'trigger', 'coping'],
};
