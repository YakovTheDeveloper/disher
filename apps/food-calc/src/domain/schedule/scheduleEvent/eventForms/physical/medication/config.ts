import { EventFormConfig } from '../../configs/types';
import { MEDICATION_SUBTYPES } from './types';

/**
 * Конфигурация формы медикаментов
 */
export const medicationConfig: EventFormConfig = {
    eventType: 'medication',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.medication.subtype',
            options: MEDICATION_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип лекарства' },
        },
        {
            key: 'name',
            type: 'text',
            labelKey: 'field.medication.name',
            validation: { required: true, minLength: 2, maxLength: 100, errorMessage: 'Введите название' },
        },
        {
            key: 'dosage',
            type: 'text',
            labelKey: 'field.medication.dosage',
            validation: { maxLength: 50 },
        },
        {
            key: 'effectiveness',
            type: 'slider',
            labelKey: 'field.medication.effectiveness',
            validation: { min: 1, max: 10 },
            defaultValue: 5,
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'name', 'dosage', 'effectiveness'],
};
