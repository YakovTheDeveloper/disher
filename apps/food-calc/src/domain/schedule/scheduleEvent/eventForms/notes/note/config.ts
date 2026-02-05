import { EventFormConfig } from '../../configs/types';

/**
 * Конфигурация формы заметки
 */
export const noteConfig: EventFormConfig = {
    eventType: 'note',
    fields: [
        {
            key: 'content',
            type: 'text',
            labelKey: 'field.note.content',
            validation: { required: true, minLength: 1, maxLength: 500, errorMessage: 'Введите текст заметки' },
        },
        {
            key: 'tags',
            type: 'multiSelect',
            labelKey: 'field.note.tags',
            options: [
                { value: 'important', labelKey: 'tag.important' },
                { value: 'idea', labelKey: 'tag.idea' },
                { value: 'reminder', labelKey: 'tag.reminder' },
                { value: 'journal', labelKey: 'tag.journal' },
                { value: 'gratitude', labelKey: 'tag.gratitude' },
            ],
            advanced: true,
        },
    ],
    serializedFields: ['content', 'tags'],
};
