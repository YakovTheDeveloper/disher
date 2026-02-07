import { EventFormConfig } from '../../configs/types';

/**
 * Конфигурация формы веса
 */
export const weightConfig: EventFormConfig = {
    eventType: 'weight',
    fields: [
        {
            key: 'value',
            type: 'text',
            labelKey: 'field.weight.value',
            validation: { required: true, minLength: 2, maxLength: 10, errorMessage: 'Введите вес' },
            unit: 'кг',
        },
        {
            key: 'unit',
            type: 'select',
            labelKey: 'field.weight.unit',
            options: [
                { value: 'kg', labelKey: 'unit.kg' },
                { value: 'lbs', labelKey: 'unit.lbs' },
            ],
            defaultValue: 'kg',
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.weight.notes',
            validation: { maxLength: 200 },
            advanced: true,
        },
    ],
    serializedFields: ['value', 'unit', 'time', 'notes'],
};
