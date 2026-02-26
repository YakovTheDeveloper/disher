// ============================================================================
// DIGITAL SUBTYPES AND TYPES
// ============================================================================

import { SubtypeOption } from '@/components/features/event/SubtypeTreeSelector';

/**
 * Древовидная структура подтипов цифровой среды
 */
export const DIGITAL_SUBTYPES_TREE: SubtypeOption[] = [
    {
        value: 'entertainment',
        labelKey: 'subtype.digital.category.entertainment',
        children: [
            { value: 'youtube', labelKey: 'subtype.digital.youtube' },
            { value: 'movies', labelKey: 'subtype.digital.movies' },
            { value: 'series', labelKey: 'subtype.digital.series' },
            { value: 'music', labelKey: 'subtype.digital.music' },
            { value: 'custom_entertainment', labelKey: 'subtype.digital.custom_entertainment' },
        ],
    },
    {
        value: 'gaming',
        labelKey: 'subtype.digital.category.gaming',
        children: [
            { value: 'casual', labelKey: 'subtype.digital.casual' },
            { value: 'competitive', labelKey: 'subtype.digital.competitive' },
            { value: 'long_session', labelKey: 'subtype.digital.long_session' },
            { value: 'custom_gaming', labelKey: 'subtype.digital.custom_gaming' },
        ],
    },
    {
        value: 'social_media',
        labelKey: 'subtype.digital.category.social_media',
        children: [
            { value: 'scrolling', labelKey: 'subtype.digital.scrolling' },
            { value: 'posting', labelKey: 'subtype.digital.posting' },
            { value: 'doomscrolling', labelKey: 'subtype.digital.doomscrolling' },
            { value: 'custom_social', labelKey: 'subtype.digital.custom_social' },
        ],
    },
    {
        value: 'screen_hygiene',
        labelKey: 'subtype.digital.category.screen_hygiene',
        children: [
            { value: 'late_screen', labelKey: 'subtype.digital.late_screen' },
            { value: 'no_phone', labelKey: 'subtype.digital.no_phone' },
            { value: 'notifications_overload', labelKey: 'subtype.digital.notifications_overload' },
            { value: 'custom_hygiene', labelKey: 'subtype.digital.custom_hygiene' },
        ],
    },
];

export type DigitalSubtype =
    | 'youtube' | 'movies' | 'series' | 'music' | 'custom_entertainment'
    | 'casual' | 'competitive' | 'long_session' | 'custom_gaming'
    | 'scrolling' | 'posting' | 'doomscrolling' | 'custom_social'
    | 'late_screen' | 'no_phone' | 'notifications_overload' | 'custom_hygiene';
