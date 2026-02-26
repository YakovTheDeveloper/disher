import { EventFormConfig } from '../../configs/types';
import { REFLECTION_SUBTYPES } from './types';

/**
 * Конфигурация формы рефлексии
 */
export const reflectionConfig: EventFormConfig = {
    eventType: 'reflection',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.reflection.subtype',
            options: REFLECTION_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип рефлексии' },
        },
        {
            key: 'title',
            type: 'text',
            labelKey: 'field.reflection.title',
            validation: { required: true, minLength: 1, maxLength: 100, errorMessage: 'Введите заголовок' },
        },
        {
            key: 'content',
            type: 'textarea',
            labelKey: 'field.reflection.content',
            validation: { maxLength: 1000 },
        },
        {
            key: 'tags',
            type: 'multiSelect',
            labelKey: 'field.reflection.tags',
            options: [
                { value: 'work', labelKey: 'tag.work' },
                { value: 'personal', labelKey: 'tag.personal' },
                { value: 'health', labelKey: 'tag.health' },
                { value: 'relationships', labelKey: 'tag.relationships' },
                { value: 'learning', labelKey: 'tag.learning' },
            ],
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'title', 'content', 'tags'],
};
