/**
 * Категории событий расписания
 */
export type EventCategory =
    | 'physical'      // Физическое состояние
    | 'mental'        // Ментальное состояние
    | 'activity'      // Физическая активность
    | 'social'        // Социальная активность
    | 'notes'         // Заметки и события
    | 'work'          // Работа и карьера
    | 'learning'      // Обучение и творчество
    | 'environment'   // Окружающая среда
    | 'digital'       // Цифровая среда
    | 'life_events';  // События жизни

// Подтипы теперь определены в соответствующих *.config.ts файлах:
// - physical.config.ts: IllnessSubtype, DigestionSubtype, MedicationSubtype, VitalsSubtype, HydrationSubtype, PainSubtype, etc.
// - mental.config.ts: StressSubtype, AnxietySubtype, RelaxationSubtype, MeditationSubtype, CreativitySubtype, AngerSubtype, etc.
// - activity.config.ts: ActivitySubtype, HobbySubtype, ChoresSubtype, TransportSubtype
// - social.config.ts: SocialSubtype, OnlineSubtype, FamilySubtype, PartnerSubtype, WorkSocialSubtype
// - notes.config.ts: TaskSubtype, GoalSubtype, ReflectionSubtype
// - work.config.ts: WorkSubtype
// - learning.config.ts: LearningSubtype
// - environment.config.ts: EnvironmentSubtype
// - digital.config.ts: DigitalSubtype
// - life-events.config.ts: LifeEventsSubtype

/**
 * Базовые типы событий
 */
export type BaseEventType =
    // Physical
    | 'sleep'
    | 'illness'
    | 'digestion'
    | 'medication'
    | 'weight'
    | 'vitals'
    | 'hydration'
    | 'pain'
    | 'allergy'
    | 'skin'
    | 'female_health'
    | 'doctor'
    | 'treatment'
    | 'nap'
    | 'rest'
    | 'active_recovery'
    // Mental
    | 'mood'
    | 'energy'
    | 'stress'
    | 'focus'
    | 'anxiety'
    | 'relaxation'
    | 'meditation'
    | 'creativity'
    | 'anger'
    | 'motivation'
    | 'therapy'
    // Activity
    | 'sport'
    | 'activity'
    | 'hobby'
    | 'chores'
    | 'transport'
    // Social
    | 'social'
    | 'online'
    | 'family'
    | 'partner'
    | 'work_social'
    // Notes
    | 'note'
    | 'custom'
    | 'gratitude'
    | 'idea'
    | 'task'
    | 'goal'
    | 'reflection'
    // Work & Career
    | 'work'
    // Learning & Creativity
    | 'learning'
    // Environment & Context
    | 'environment'
    // Digital & Media
    | 'digital'
    // Life Events
    | 'life_events';

export type BaseGroupEventType =
    | 'physical'
    | 'mental'
    | 'activity'
    | 'social'
    | 'notes'
    | 'work'
    | 'learning'
    | 'environment'
    | 'digital'
    | 'life_events';

/**
 * Полный тип события с категорией
 */
export interface EventTypeDefinition {
    /** Уникальный ключ типа события */
    type: BaseEventType;
    /** Категория для группировки в UI */
    category: EventCategory;
    /** Ключ локализации для отображения */
    localizationKey: string;
    /** Поддерживаемые подтипы (если есть) */
    subtypes?: string[];
}

/**
 * Подтип события (просто строка)
 */
export type EventSubtype = string;

/**
 * Все типы событий с определениями
 */
export const EVENT_TYPES: Record<BaseEventType, EventTypeDefinition> = {
    // === PHYSICAL (Физическое состояние) ===
    sleep: {
        type: 'sleep',
        category: 'physical',
        localizationKey: 'event.sleep',
    },
    illness: {
        type: 'illness',
        category: 'physical',
        localizationKey: 'event.illness',
        subtypes: ['headache', 'cold', 'fever', 'cough', 'nausea', 'allergy', 'pain', 'fatigue'],
    },
    digestion: {
        type: 'digestion',
        category: 'physical',
        localizationKey: 'event.digestion',
        subtypes: ['bloating', 'stomach_pain', 'heartburn', 'constipation', 'diarrhea'],
    },
    medication: {
        type: 'medication',
        category: 'physical',
        localizationKey: 'event.medication',
        subtypes: ['pill', 'drops', 'injection', 'syrup', 'topical', 'other'],
    },
    weight: {
        type: 'weight',
        category: 'physical',
        localizationKey: 'event.weight',
    },
    vitals: {
        type: 'vitals',
        category: 'physical',
        localizationKey: 'event.vitals',
        subtypes: ['blood_pressure', 'heart_rate', 'temperature', 'blood_sugar', 'oxygen'],
    },
    hydration: {
        type: 'hydration',
        category: 'physical',
        localizationKey: 'event.hydration',
        subtypes: ['water', 'tea', 'coffee', 'juice', 'energy_drink', 'smoothie'],
    },
    // === MENTAL (Ментальное состояние) ===
    mood: {
        type: 'mood',
        category: 'mental',
        localizationKey: 'event.mood',
    },
    energy: {
        type: 'energy',
        category: 'mental',
        localizationKey: 'event.energy',
    },
    stress: {
        type: 'stress',
        category: 'mental',
        localizationKey: 'event.stress',
        subtypes: ['work', 'personal', 'financial', 'health', 'relationship'],
    },
    focus: {
        type: 'focus',
        category: 'mental',
        localizationKey: 'event.focus',
    },
    anxiety: {
        type: 'anxiety',
        category: 'mental',
        localizationKey: 'event.anxiety',
        subtypes: ['mild', 'moderate', 'severe', 'panic', 'general', 'social'],
    },
    relaxation: {
        type: 'relaxation',
        category: 'mental',
        localizationKey: 'event.relaxation',
        subtypes: ['breathing', 'stretching', 'bath', 'reading', 'music', 'massage', 'nature'],
    },
    meditation: {
        type: 'meditation',
        category: 'mental',
        localizationKey: 'event.meditation',
        subtypes: ['mindfulness', 'guided', 'body_scan', 'yoga_nidra', 'loving_kindness', 'transcendental'],
    },
    creativity: {
        type: 'creativity',
        category: 'mental',
        localizationKey: 'event.creativity',
        subtypes: ['drawing', 'writing', 'music', 'crafts', 'cooking', 'photography', 'diy'],
    },

    // === ACTIVITY (Физическая активность) ===
    sport: {
        type: 'sport',
        category: 'activity',
        localizationKey: 'event.sport',
        subtypes: ['running', 'gym', 'football', 'basketball', 'tennis', 'swimming', 'yoga', 'cycling'],
    },
    activity: {
        type: 'activity',
        category: 'activity',
        localizationKey: 'event.activity',
        subtypes: ['sport', 'walk', 'exercise', 'steps', 'swimming', 'cycling', 'yoga', 'dancing'],
    },
    hobby: {
        type: 'hobby',
        category: 'activity',
        localizationKey: 'event.hobby',
        subtypes: ['gaming', 'gardening', 'knitting', 'photography', 'collecting', 'astronomy', 'bird_watching', 'fishing'],
    },
    chores: {
        type: 'chores',
        category: 'activity',
        localizationKey: 'event.chores',
        subtypes: ['cleaning', 'laundry', 'shopping', 'errands', 'cooking', 'dishwashing', 'organizing', 'home_repair'],
    },
    transport: {
        type: 'transport',
        category: 'activity',
        localizationKey: 'event.transport',
        subtypes: ['walking', 'cycling', 'driving', 'public_transit', 'taxi', 'running'],
    },

    // === SOCIAL (Социальная активность) ===
    social: {
        type: 'social',
        category: 'social',
        localizationKey: 'event.social',
        subtypes: ['friends', 'family', 'partner', 'work_meeting', 'party', 'call', 'date'],
    },
    online: {
        type: 'online',
        category: 'social',
        localizationKey: 'event.online',
        subtypes: ['video_call', 'messenger', 'social_media', 'email', 'gaming', 'forum', 'streaming'],
    },
    family: {
        type: 'family',
        category: 'social',
        localizationKey: 'event.family',
        subtypes: ['kids', 'parents', 'siblings', 'extended_family', 'pets', 'quality_time'],
    },
    partner: {
        type: 'partner',
        category: 'social',
        localizationKey: 'event.partner',
        subtypes: ['date_night', 'conversation', 'intimacy', 'shared_activity', 'support', 'conflict'],
    },

    // === NOTES (Заметки и события) ===
    note: {
        type: 'note',
        category: 'notes',
        localizationKey: 'event.note',
    },
    custom: {
        type: 'custom',
        category: 'notes',
        localizationKey: 'event.custom',
    },
    gratitude: {
        type: 'gratitude',
        category: 'notes',
        localizationKey: 'event.gratitude',
    },
    idea: {
        type: 'idea',
        category: 'notes',
        localizationKey: 'event.idea',
    },
    task: {
        type: 'task',
        category: 'notes',
        localizationKey: 'event.task',
        subtypes: ['priority_low', 'priority_medium', 'priority_high', 'urgent', 'delegated', 'recurring'],
    },
    goal: {
        type: 'goal',
        category: 'notes',
        localizationKey: 'event.goal',
        subtypes: ['daily', 'weekly', 'monthly', 'quarterly', 'long_term', 'milestone'],
    },
    reflection: {
        type: 'reflection',
        category: 'notes',
        localizationKey: 'event.reflection',
        subtypes: ['daily_review', 'lesson_learned', 'decision_log', 'custom'],
    },

    // === NEW PHYSICAL TYPES ===
    pain: {
        type: 'pain',
        category: 'physical',
        localizationKey: 'event.pain',
        subtypes: ['headache', 'toothache', 'back_pain', 'neck_pain', 'muscle_pain', 'joint_pain', 'abdominal_pain', 'period_pain', 'stomach_pain', 'custom'],
    },
    allergy: {
        type: 'allergy',
        category: 'physical',
        localizationKey: 'event.allergy',
        subtypes: ['rhinitis', 'itching', 'rash', 'watery_eyes', 'asthma_like', 'custom'],
    },
    skin: {
        type: 'skin',
        category: 'physical',
        localizationKey: 'event.skin',
        subtypes: ['acne', 'dermatitis', 'dryness', 'wound', 'bruise', 'sunburn', 'custom'],
    },
    female_health: {
        type: 'female_health',
        category: 'physical',
        localizationKey: 'event.female_health',
        subtypes: ['cycle_start', 'cycle_end', 'ovulation', 'pms', 'spotting', 'custom'],
    },
    doctor: {
        type: 'doctor',
        category: 'physical',
        localizationKey: 'event.doctor',
        subtypes: ['appointment', 'procedure', 'vaccination', 'test_result', 'custom'],
    },
    treatment: {
        type: 'treatment',
        category: 'physical',
        localizationKey: 'event.treatment',
        subtypes: ['physio', 'massage', 'ice_heat', 'stretch_protocol', 'custom'],
    },
    nap: {
        type: 'nap',
        category: 'physical',
        localizationKey: 'event.nap',
        subtypes: ['nap_short', 'nap_long', 'custom'],
    },
    rest: {
        type: 'rest',
        category: 'physical',
        localizationKey: 'event.rest',
        subtypes: ['lying_down', 'doing_nothing', 'spa_bath', 'custom'],
    },
    active_recovery: {
        type: 'active_recovery',
        category: 'physical',
        localizationKey: 'event.active_recovery',
        subtypes: ['stretching_recovery', 'walk_easy', 'breathing_nsdr', 'custom'],
    },

    // === NEW MENTAL TYPES ===
    anger: {
        type: 'anger',
        category: 'mental',
        localizationKey: 'event.anger',
        subtypes: ['anger', 'resentment', 'shame', 'guilt', 'custom'],
    },
    motivation: {
        type: 'motivation',
        category: 'mental',
        localizationKey: 'event.motivation',
        subtypes: ['inspired', 'resistant', 'procrastinating', 'custom'],
    },
    therapy: {
        type: 'therapy',
        category: 'mental',
        localizationKey: 'event.therapy',
        subtypes: ['session', 'homework', 'breakthrough', 'custom'],
    },

    // === NEW SOCIAL TYPES ===
    work_social: {
        type: 'work_social',
        category: 'social',
        localizationKey: 'event.work_social',
        subtypes: ['team_bonding', 'conflict', 'feedback', 'custom'],
    },

    // === NEW CATEGORIES ===
    work: {
        type: 'work',
        category: 'work',
        localizationKey: 'event.work',
    },
    learning: {
        type: 'learning',
        category: 'learning',
        localizationKey: 'event.learning',
    },
    environment: {
        type: 'environment',
        category: 'environment',
        localizationKey: 'event.environment',
    },
    digital: {
        type: 'digital',
        category: 'digital',
        localizationKey: 'event.digital',
    },
    life_events: {
        type: 'life_events',
        category: 'life_events',
        localizationKey: 'event.life_events',
    },
};

/**
 * Категории для группировки в UI
 */
export const EVENT_CATEGORIES: Record<EventCategory, {
    localizationKey: string;
    order: number;
}> = {
    physical: {
        localizationKey: 'category.physical',
        order: 1,
    },
    mental: {
        localizationKey: 'category.mental',
        order: 2,
    },
    activity: {
        localizationKey: 'category.activity',
        order: 3,
    },
    social: {
        localizationKey: 'category.social',
        order: 4,
    },
    notes: {
        localizationKey: 'category.notes',
        order: 5,
    },
    work: {
        localizationKey: 'category.work',
        order: 6,
    },
    learning: {
        localizationKey: 'category.learning',
        order: 7,
    },
    environment: {
        localizationKey: 'category.environment',
        order: 8,
    },
    digital: {
        localizationKey: 'category.digital',
        order: 9,
    },
    life_events: {
        localizationKey: 'category.life_events',
        order: 10,
    },
};

/**
 * Получить определение типа события
 */
export function getEventTypeDefinition(type: BaseEventType): EventTypeDefinition {
    return EVENT_TYPES[type];
}

/**
 * Получить все типы в категории
 */
export function getEventTypesByCategory(category: EventCategory): EventTypeDefinition[] {
    return Object.values(EVENT_TYPES).filter(t => t.category === category);
}

/**
 * Проверить, есть ли у типа подтипы
 */
export function hasSubtypes(type: BaseEventType): boolean {
    return EVENT_TYPES[type].subtypes !== undefined && EVENT_TYPES[type].subtypes!.length > 0;
}

/**
 * Получить подтипы для типа
 */
export function getSubtypes(type: BaseEventType): EventSubtype[] {
    return EVENT_TYPES[type].subtypes || [];
}

export function getTypeGroupName(type: BaseEventType): BaseGroupEventType {
    return EVENT_TYPES[type].category;
}