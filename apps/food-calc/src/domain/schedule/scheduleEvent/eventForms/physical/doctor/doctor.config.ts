import { EventFormConfig } from '../../configs/types';
import { DOCTOR_SUBTYPES } from './types';

/**
 * Конфигурация формы посещения врача
 */
export const doctorConfig: EventFormConfig = {
    eventType: 'doctor',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.doctor.subtype',
            options: DOCTOR_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип визита' },
        },
        {
            key: 'doctor_name',
            type: 'text',
            labelKey: 'field.doctor.doctor_name',
            validation: { maxLength: 100 },
            advanced: true,
        },
        {
            key: 'notes',
            type: 'text',
            labelKey: 'field.doctor.notes',
            validation: { maxLength: 300 },
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'doctor_name', 'notes'],
};
