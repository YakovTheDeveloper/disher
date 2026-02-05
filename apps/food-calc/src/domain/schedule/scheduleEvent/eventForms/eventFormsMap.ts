import { EventFormConfig } from './configs/types';
import { BaseEventType } from '../eventTypes';

// Import all category configs
import {
    sleepConfig,
    illnessConfig,
    digestionConfig,
    medicationConfig,
    weightConfig,
    vitalsConfig,
    hydrationConfig,
} from './physical';

import {
    moodConfig,
    energyConfig,
    stressConfig,
    focusConfig,
    anxietyConfig,
    relaxationConfig,
    meditationConfig,
    creativityConfig
} from './mental';

import {
    activityConfig,
} from './activity';

import {
    socialConfig,
    onlineConfig,
    familyConfig,
    partnerConfig
} from './social';

import {
    noteConfig,
    customConfig,
    gratitudeConfig,
    ideaConfig,
    taskConfig,
    goalConfig
} from './notes';

/**
 * Объединяющая карта всех конфигураций форм событий
 */
export const EVENT_FORMS: Record<BaseEventType, EventFormConfig> = {
    // === PHYSICAL ===
    sleep: sleepConfig,
    illness: illnessConfig,
    digestion: digestionConfig,
    medication: medicationConfig,
    weight: weightConfig,
    vitals: vitalsConfig,
    hydration: hydrationConfig,

    // === MENTAL ===
    mood: moodConfig,
    energy: energyConfig,
    stress: stressConfig,
    focus: focusConfig,
    anxiety: anxietyConfig,
    relaxation: relaxationConfig,
    meditation: meditationConfig,
    creativity: creativityConfig,

    // === ACTIVITY ===
    activity: activityConfig,

    // === SOCIAL ===
    social: socialConfig,
    online: onlineConfig,
    family: familyConfig,
    partner: partnerConfig,

    // === NOTES ===
    note: noteConfig,
    custom: customConfig,
    gratitude: gratitudeConfig,
    idea: ideaConfig,
    task: taskConfig,
    goal: goalConfig,
} as const;