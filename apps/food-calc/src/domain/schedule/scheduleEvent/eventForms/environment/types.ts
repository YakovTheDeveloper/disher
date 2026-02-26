// ============================================================================
// ENVIRONMENT SUBTYPES AND TYPES
// ============================================================================

import { SubtypeOption } from '@/components/features/event/SubtypeTreeSelector';

/**
 * Древовидная структура подтипов окружающей среды
 */
export const ENVIRONMENT_SUBTYPES_TREE: SubtypeOption[] = [
    {
        value: 'location',
        labelKey: 'subtype.environment.category.location',
        children: [
            { value: 'home', labelKey: 'subtype.environment.home' },
            { value: 'office', labelKey: 'subtype.environment.office' },
            { value: 'outdoors', labelKey: 'subtype.environment.outdoors' },
            { value: 'travel', labelKey: 'subtype.environment.travel' },
            { value: 'custom_location', labelKey: 'subtype.environment.custom_location' },
        ],
    },
    {
        value: 'weather',
        labelKey: 'subtype.environment.category.weather',
        children: [
            { value: 'sunny', labelKey: 'subtype.environment.sunny' },
            { value: 'cloudy', labelKey: 'subtype.environment.cloudy' },
            { value: 'rain', labelKey: 'subtype.environment.rain' },
            { value: 'snow', labelKey: 'subtype.environment.snow' },
            { value: 'heat', labelKey: 'subtype.environment.heat' },
            { value: 'custom_weather', labelKey: 'subtype.environment.custom_weather' },
        ],
    },
    {
        value: 'noise',
        labelKey: 'subtype.environment.category.noise',
        children: [
            { value: 'quiet', labelKey: 'subtype.environment.quiet' },
            { value: 'moderate', labelKey: 'subtype.environment.moderate' },
            { value: 'loud', labelKey: 'subtype.environment.loud' },
            { value: 'construction', labelKey: 'subtype.environment.construction' },
            { value: 'custom_noise', labelKey: 'subtype.environment.custom_noise' },
        ],
    },
    {
        value: 'light',
        labelKey: 'subtype.environment.category.light',
        children: [
            { value: 'low_light', labelKey: 'subtype.environment.low_light' },
            { value: 'bright_light', labelKey: 'subtype.environment.bright_light' },
            { value: 'screen_glare', labelKey: 'subtype.environment.screen_glare' },
            { value: 'custom_light', labelKey: 'subtype.environment.custom_light' },
        ],
    },
    {
        value: 'air',
        labelKey: 'subtype.environment.category.air',
        children: [
            { value: 'fresh', labelKey: 'subtype.environment.fresh' },
            { value: 'stuffy', labelKey: 'subtype.environment.stuffy' },
            { value: 'smoke', labelKey: 'subtype.environment.smoke' },
            { value: 'allergens', labelKey: 'subtype.environment.allergens' },
            { value: 'custom_air', labelKey: 'subtype.environment.custom_air' },
        ],
    },
];

export type EnvironmentSubtype =
    | 'home' | 'office' | 'outdoors' | 'travel' | 'custom_location'
    | 'sunny' | 'cloudy' | 'rain' | 'snow' | 'heat' | 'custom_weather'
    | 'quiet' | 'moderate' | 'loud' | 'construction' | 'custom_noise'
    | 'low_light' | 'bright_light' | 'screen_glare' | 'custom_light'
    | 'fresh' | 'stuffy' | 'smoke' | 'allergens' | 'custom_air';
