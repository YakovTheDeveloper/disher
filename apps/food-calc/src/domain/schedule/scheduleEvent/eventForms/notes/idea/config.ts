import { EventFormConfig } from '../../configs/types';

/**
 * Конфигурация формы идеи
 */
export const ideaConfig: EventFormConfig = {
    eventType: 'idea',
    fields: [
        {
            key: 'title',
            type: 'text',
            labelKey: 'field.idea.title',
            validation: { required: true, minLength: 1, maxLength: 100, errorMessage: 'Введите название идеи' },
        },
        {
            key: 'description',
            type: 'text',
            labelKey: 'field.idea.description',
            validation: { maxLength: 500 },
        },
        {
            key: 'category',
            type: 'select',
            labelKey: 'field.idea.category',
            options: [
                { value: 'work', labelKey: 'category.work' },
                { value: 'personal', labelKey: 'category.personal' },
                { value: 'creative', labelKey: 'category.creative' },
                { value: 'health', labelKey: 'category.health' },
                { value: 'other', labelKey: 'category.other' },
            ],
            advanced: true,
        },
        {
            key: 'priority',
            type: 'slider',
            labelKey: 'field.idea.priority',
            validation: { min: 1, max: 10 },
            defaultValue: 5,
            advanced: true,
        },
    ],
    serializedFields: ['title', 'description', 'category', 'priority'],
};
