import { EventFormConfig } from '../../configs/types';
import { TASK_SUBTYPES } from './types';

/**
 * Конфигурация формы задачи
 */
export const taskConfig: EventFormConfig = {
    eventType: 'task',
    fields: [
        {
            key: 'title',
            type: 'text',
            labelKey: 'field.task.title',
            validation: { required: true, minLength: 1, maxLength: 100, errorMessage: 'Введите название задачи' },
        },
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.task.subtype',
            options: TASK_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите приоритет' },
        },
        {
            key: 'description',
            type: 'text',
            labelKey: 'field.task.description',
            validation: { maxLength: 500 },
            advanced: true,
        },
        {
            key: 'deadline',
            type: 'time',
            labelKey: 'field.task.deadline',
            advanced: true,
        },
    ],
    serializedFields: ['title', 'subtype', 'description', 'deadline'],
};
