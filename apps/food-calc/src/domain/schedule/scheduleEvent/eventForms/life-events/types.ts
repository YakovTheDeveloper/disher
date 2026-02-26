// ============================================================================
// LIFE EVENTS SUBTYPES AND TYPES
// ============================================================================

import { SubtypeOption } from '@/components/features/event/SubtypeTreeSelector';

/**
 * Древовидная структура подтипов событий жизни
 */
export const LIFE_EVENTS_SUBTYPES_TREE: SubtypeOption[] = [
    {
        value: 'milestone',
        labelKey: 'subtype.life_events.category.milestone',
        children: [
            { value: 'birthday', labelKey: 'subtype.life_events.birthday' },
            { value: 'move', labelKey: 'subtype.life_events.move' },
            { value: 'wedding', labelKey: 'subtype.life_events.wedding' },
            { value: 'new_job', labelKey: 'subtype.life_events.new_job' },
            { value: 'custom_milestone', labelKey: 'subtype.life_events.custom_milestone' },
        ],
    },
    {
        value: 'unexpected',
        labelKey: 'subtype.life_events.category.unexpected',
        children: [
            { value: 'accident', labelKey: 'subtype.life_events.accident' },
            { value: 'bad_news', labelKey: 'subtype.life_events.bad_news' },
            { value: 'good_news', labelKey: 'subtype.life_events.good_news' },
            { value: 'loss', labelKey: 'subtype.life_events.loss' },
            { value: 'custom_unexpected', labelKey: 'subtype.life_events.custom_unexpected' },
        ],
    },
    {
        value: 'travel_event',
        labelKey: 'subtype.life_events.category.travel_event',
        children: [
            { value: 'flight', labelKey: 'subtype.life_events.flight' },
            { value: 'hotel', labelKey: 'subtype.life_events.hotel' },
            { value: 'delay', labelKey: 'subtype.life_events.delay' },
            { value: 'custom_travel', labelKey: 'subtype.life_events.custom_travel' },
        ],
    },
];

export type LifeEventsSubtype =
    | 'birthday' | 'move' | 'wedding' | 'new_job' | 'custom_milestone'
    | 'accident' | 'bad_news' | 'good_news' | 'loss' | 'custom_unexpected'
    | 'flight' | 'hotel' | 'delay' | 'custom_travel';
