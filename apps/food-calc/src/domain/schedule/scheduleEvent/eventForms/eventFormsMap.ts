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
    painConfig,
    allergyConfig,
    skinConfig,
    femaleHealthConfig,
    doctorConfig,
    treatmentConfig,
    napConfig,
    restConfig,
    activeRecoveryConfig,
} from './physical';

import {
    moodConfig,
    energyConfig,
    stressConfig,
    focusConfig,
    anxietyConfig,
    relaxationConfig,
    meditationConfig,
    creativityConfig,
    angerConfig,
    motivationConfig,
    therapyConfig,
} from './mental';

import {
    activityConfig,
} from './activity';

import {
    socialConfig,
    onlineConfig,
    familyConfig,
    partnerConfig,
    workSocialConfig,
} from './social';

import {
    noteConfig,
    customConfig,
    gratitudeConfig,
    ideaConfig,
    taskConfig,
    goalConfig,
    reflectionConfig,
} from './notes';

import {
    workConfig,
} from './work';

import {
    learningConfig,
} from './learning';

import {
    environmentConfig,
} from './environment';

import {
    digitalConfig,
} from './digital';

import {
    lifeEventsConfig,
} from './life-events';

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
    pain: painConfig,
    allergy: allergyConfig,
    skin: skinConfig,
    female_health: femaleHealthConfig,
    doctor: doctorConfig,
    treatment: treatmentConfig,
    nap: napConfig,
    rest: restConfig,
    active_recovery: activeRecoveryConfig,

    // === MENTAL ===
    mood: moodConfig,
    energy: energyConfig,
    stress: stressConfig,
    focus: focusConfig,
    anxiety: anxietyConfig,
    relaxation: relaxationConfig,
    meditation: meditationConfig,
    creativity: creativityConfig,
    anger: angerConfig,
    motivation: motivationConfig,
    therapy: therapyConfig,

    // === ACTIVITY ===
    activity: activityConfig,

    // === SOCIAL ===
    social: socialConfig,
    online: onlineConfig,
    family: familyConfig,
    partner: partnerConfig,
    work_social: workSocialConfig,

    // === NOTES ===
    note: noteConfig,
    custom: customConfig,
    gratitude: gratitudeConfig,
    idea: ideaConfig,
    task: taskConfig,
    goal: goalConfig,
    reflection: reflectionConfig,

    // === WORK ===
    work: workConfig,

    // === LEARNING ===
    learning: learningConfig,

    // === ENVIRONMENT ===
    environment: environmentConfig,

    // === DIGITAL ===
    digital: digitalConfig,

    // === LIFE EVENTS ===
    life_events: lifeEventsConfig,
} as const;