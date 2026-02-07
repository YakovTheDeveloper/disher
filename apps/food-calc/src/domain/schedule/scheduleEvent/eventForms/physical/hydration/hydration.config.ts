import { EventFormConfig } from '../../configs/types';
import { HYDRATION_SUBTYPES } from './types';

/**
 * Конфигурация формы гидратации
 */
export const hydrationConfig: EventFormConfig = {
    eventType: 'hydration',
    fields: [
        {
            key: 'subtype',
            type: 'select',
            labelKey: 'field.hydration.subtype',
            options: HYDRATION_SUBTYPES,
            validation: { required: true, errorMessage: 'Выберите тип напитка' },
        },
        {
            key: 'amount',
            type: 'text',
            labelKey: 'field.hydration.amount',
            validation: { required: true, minLength: 1, maxLength: 10, errorMessage: 'Введите объём' },
            unit: 'мл',
        },
        {
            key: 'temperature',
            type: 'select',
            labelKey: 'field.hydration.temperature',
            options: [
                { value: 'cold', labelKey: 'temperature.cold' },
                { value: 'room', labelKey: 'temperature.room' },
                { value: 'hot', labelKey: 'temperature.hot' },
            ],
            defaultValue: 'room',
            advanced: true,
        },
    ],
    serializedFields: ['subtype', 'amount', 'temperature'],
};
