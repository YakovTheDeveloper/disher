import { EventFormConfig } from '../configs/types';
import { LIFE_EVENTS_SUBTYPES_TREE } from './types';

/**
 * Конфигурация формы событий жизни
 */
export const lifeEventsConfig: EventFormConfig = {
    eventType: 'life_events',
    fields: [
        {
            key: 'subtype',
            type: 'tree',
            labelKey: 'field.life_events.subtype',
            options: LIFE_EVENTS_SUBTYPES_TREE,
            validation: { required: true, errorMessage: 'Выберите тип события' },
            maxDepth: 2,
        },
        {
            key: 'significance',
            type: 'slider',
            labelKey: 'field.life_events.significance',
            validation: { min: 1, max: 10, required: true, errorMessage: 'Важность от 1 до 10' },
            defaultValue: 7,
        },
        {
            key: 'notes',
            type: 'textarea',
            labelKey: 'field.life_events.notes',
            validation: { maxLength: 500 },
        },
    ],
    serializedFields: ['subtype', 'significance', 'notes'],
};
