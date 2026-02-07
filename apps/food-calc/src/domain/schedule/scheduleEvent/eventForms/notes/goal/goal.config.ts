import { EventFormConfig } from '../../configs/types';
import { GOAL_SUBTYPES } from './types';

/**
 * Конфигурация формы цели
 */
export const goalConfig: EventFormConfig = {
    eventType: 'goal',
    fields: [
        {
            key: 'title',
            type: 'text',
            labelKey: 'field.goal.title',
            validation: { required: true, minLength: 1, maxLength: 100, errorMessage: 'Введите название цели' },
        },
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.goal.subtype',
            options: GOAL_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип цели' },
        },
        {
            key: 'progress',
            type: 'slider',
            labelKey: 'field.goal.progress',
            validation: { min: 0, max: 100 },
            defaultValue: 0,
            unit: '%',
        },
        {
            key: 'milestones',
            type: 'text',
            labelKey: 'field.goal.milestones',
            validation: { maxLength: 500 },
            advanced: true,
        },
    ],
    serializedFields: ['title', 'subtype', 'progress', 'milestones'],
};
