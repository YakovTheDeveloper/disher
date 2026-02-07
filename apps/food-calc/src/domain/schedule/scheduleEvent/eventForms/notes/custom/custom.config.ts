import { EventFormConfig } from '../../configs/types';

/**
 * Конфигурация формы кастомной заметки
 */
export const customConfig: EventFormConfig = {
    eventType: 'custom',
    fields: [
        {
            key: 'name',
            type: 'text',
            labelKey: 'field.custom.name',
            validation: { required: true, minLength: 1, maxLength: 100, errorMessage: 'Введите название' },
        },
        {
            key: 'value',
            type: 'text',
            labelKey: 'field.custom.value',
            validation: { maxLength: 200 },
        },
    ],
    serializedFields: ['name', 'value'],
};
