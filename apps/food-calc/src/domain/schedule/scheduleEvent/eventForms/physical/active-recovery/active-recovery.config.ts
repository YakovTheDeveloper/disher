import { EventFormConfig } from '../../configs/types';
import { ACTIVE_RECOVERY_SUBTYPES } from './types';

/**
 * Конфигурация формы активного восстановления
 */
export const activeRecoveryConfig: EventFormConfig = {
    eventType: 'active_recovery',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.active_recovery.subtype',
            options: ACTIVE_RECOVERY_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип активности' },
        },
        {
            key: 'duration',
            type: 'duration',
            labelKey: 'field.active_recovery.duration',
            validation: { min: 0, max: 4, required: true, errorMessage: 'Укажите продолжительность' },
            defaultValue: '00:15',
        },
        {
            key: 'well_being',
            type: 'slider',
            labelKey: 'field.active_recovery.well_being',
            validation: { min: 1, max: 10, required: false },
            defaultValue: 7,
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'duration', 'well_being'],
};
