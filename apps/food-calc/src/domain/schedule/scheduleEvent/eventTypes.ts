/**
 * Категории событий расписания
 */
export type EventCategory =
    | 'physical'      // Физическое состояние
    | 'mental'        // Ментальное состояние
    | 'activity'      // Физическая активность
    | 'social'        // Социальная активность
    | 'notes';        // Заметки и события

// Подтипы теперь определены в соответствующих *.config.ts файлах:
// - physical.config.ts: IllnessSubtype, DigestionSubtype, MedicationSubtype, VitalsSubtype, HydrationSubtype
// - mental.config.ts: StressSubtype, AnxietySubtype, RelaxationSubtype, MeditationSubtype, CreativitySubtype
// - activity.config.ts: ActivitySubtype, HobbySubtype, ChoresSubtype, TransportSubtype
// - social.config.ts: SocialSubtype, OnlineSubtype, FamilySubtype, PartnerSubtype
// - notes.config.ts: TaskSubtype, GoalSubtype

/**
 * Все возможные подтипы событий (объединение из всех config файлов)
 */
export type EventSubtype =
    | import('./eventForms/physical.config').IllnessSubtype
    | import('./eventForms/physical.config').DigestionSubtype
    | import('./eventForms/physical.config').MedicationSubtype
    | import('./eventForms/physical.config').VitalsSubtype
    | import('./eventForms/physical.config').HydrationSubtype
    | import('./eventForms/mental.config').StressSubtype
    | import('./eventForms/mental.config').AnxietySubtype
    | import('./eventForms/mental.config').RelaxationSubtype
    | import('./eventForms/mental.config').MeditationSubtype
    | import('./eventForms/mental.config').CreativitySubtype
    | import('./eventForms/activity.config').ActivitySubtype
    | import('./eventForms/activity.config').HobbySubtype
    | import('./eventForms/activity.config').ChoresSubtype
    | import('./eventForms/activity.config').TransportSubtype
    | import('./eventForms/social.config').SocialSubtype
    | import('./eventForms/social.config').OnlineSubtype
    | import('./eventForms/social.config').FamilySubtype
    | import('./eventForms/social.config').PartnerSubtype
    | import('./eventForms/notes.config').TaskSubtype
    | import('./eventForms/notes.config').GoalSubtype;

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
    // Mental
    | 'mood'
    | 'energy'
    | 'stress'
    | 'focus'
    | 'anxiety'
    | 'relaxation'
    | 'meditation'
    | 'creativity'
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
    // Notes
    | 'note'
    | 'custom'
    | 'gratitude'
    | 'idea'
    | 'task'
    | 'goal';

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
    subtypes?: EventSubtype[];
    /** Иконка по умолчанию */
    defaultIcon: string;
    /** Цвет для визуальной идентификации */
    color: string;
}

/**
 * Все типы событий с определениями
 */
export const EVENT_TYPES: Record<BaseEventType, EventTypeDefinition> = {
    // === PHYSICAL (Физическое состояние) ===
    sleep: {
        type: 'sleep',
        category: 'physical',
        localizationKey: 'event.sleep',
        defaultIcon: 'sleep',
        color: '#6366F1', // Indigo
    },
    illness: {
        type: 'illness',
        category: 'physical',
        localizationKey: 'event.illness',
        subtypes: ['headache', 'cold', 'fever', 'cough', 'nausea', 'allergy', 'pain', 'fatigue'],
        defaultIcon: 'illness',
        color: '#EF4444', // Red
    },
    digestion: {
        type: 'digestion',
        category: 'physical',
        localizationKey: 'event.digestion',
        subtypes: ['bloating', 'stomach_pain', 'heartburn', 'constipation', 'diarrhea'],
        defaultIcon: 'digestion',
        color: '#F97316', // Orange
    },
    medication: {
        type: 'medication',
        category: 'physical',
        localizationKey: 'event.medication',
        subtypes: ['pill', 'drops', 'injection', 'syrup', 'topical', 'other'],
        defaultIcon: 'medication',
        color: '#10B981', // Emerald
    },
    weight: {
        type: 'weight',
        category: 'physical',
        localizationKey: 'event.weight',
        defaultIcon: 'weight',
        color: '#14B8A6', // Teal
    },
    vitals: {
        type: 'vitals',
        category: 'physical',
        localizationKey: 'event.vitals',
        subtypes: ['blood_pressure', 'heart_rate', 'temperature', 'blood_sugar', 'oxygen'],
        defaultIcon: 'vitals',
        color: '#06B6D4', // Cyan
    },
    hydration: {
        type: 'hydration',
        category: 'physical',
        localizationKey: 'event.hydration',
        subtypes: ['water', 'tea', 'coffee', 'juice', 'energy_drink', 'smoothie'],
        defaultIcon: 'hydration',
        color: '#0EA5E9', // Sky Blue
    },
    // === MENTAL (Ментальное состояние) ===
    mood: {
        type: 'mood',
        category: 'mental',
        localizationKey: 'event.mood',
        defaultIcon: 'mood',
        color: '#8B5CF6', // Violet
    },
    energy: {
        type: 'energy',
        category: 'mental',
        localizationKey: 'event.energy',
        defaultIcon: 'energy',
        color: '#EAB308', // Yellow
    },
    stress: {
        type: 'stress',
        category: 'mental',
        localizationKey: 'event.stress',
        subtypes: ['work', 'personal', 'financial', 'health', 'relationship'],
        defaultIcon: 'stress',
        color: '#DC2626', // Dark Red
    },
    focus: {
        type: 'focus',
        category: 'mental',
        localizationKey: 'event.focus',
        defaultIcon: 'focus',
        color: '#3B82F6', // Blue
    },
    anxiety: {
        type: 'anxiety',
        category: 'mental',
        localizationKey: 'event.anxiety',
        subtypes: ['mild', 'moderate', 'severe', 'panic', 'general', 'social'],
        defaultIcon: 'anxiety',
        color: '#F43F5E', // Rose
    },
    relaxation: {
        type: 'relaxation',
        category: 'mental',
        localizationKey: 'event.relaxation',
        subtypes: ['breathing', 'stretching', 'bath', 'reading', 'music', 'massage', 'nature'],
        defaultIcon: 'relaxation',
        color: '#34D399', // Emerald Light
    },
    meditation: {
        type: 'meditation',
        category: 'mental',
        localizationKey: 'event.meditation',
        subtypes: ['mindfulness', 'guided', 'body_scan', 'yoga_nidra', 'loving_kindness', 'transcendental'],
        defaultIcon: 'meditation',
        color: '#818CF8', // Indigo Light
    },
    creativity: {
        type: 'creativity',
        category: 'mental',
        localizationKey: 'event.creativity',
        subtypes: ['drawing', 'writing', 'music', 'crafts', 'cooking', 'photography', 'diy'],
        defaultIcon: 'creativity',
        color: '#F472B6', // Pink Light
    },

    // === ACTIVITY (Физическая активность) ===
    sport: {
        type: 'sport',
        category: 'activity',
        localizationKey: 'event.sport',
        subtypes: ['running', 'gym', 'football', 'basketball', 'tennis', 'swimming', 'yoga', 'cycling'],
        defaultIcon: 'sport',
        color: '#10B981', // Emerald
    },
    activity: {
        type: 'activity',
        category: 'activity',
        localizationKey: 'event.activity',
        subtypes: ['sport', 'walk', 'exercise', 'steps', 'swimming', 'cycling', 'yoga', 'dancing'],
        defaultIcon: 'activity',
        color: '#22C55E', // Green
    },
    hobby: {
        type: 'hobby',
        category: 'activity',
        localizationKey: 'event.hobby',
        subtypes: ['gaming', 'gardening', 'knitting', 'photography', 'collecting', 'astronomy', 'bird_watching', 'fishing'],
        defaultIcon: 'hobby',
        color: '#84CC16', // Lime
    },
    chores: {
        type: 'chores',
        category: 'activity',
        localizationKey: 'event.chores',
        subtypes: ['cleaning', 'laundry', 'shopping', 'errands', 'cooking', 'dishwashing', 'organizing', 'home_repair'],
        defaultIcon: 'chores',
        color: '#A3E635', // Lime Light
    },
    transport: {
        type: 'transport',
        category: 'activity',
        localizationKey: 'event.transport',
        subtypes: ['walking', 'cycling', 'driving', 'public_transit', 'taxi', 'running'],
        defaultIcon: 'transport',
        color: '#64748B', // Slate
    },

    // === SOCIAL (Социальная активность) ===
    social: {
        type: 'social',
        category: 'social',
        localizationKey: 'event.social',
        subtypes: ['friends', 'family', 'partner', 'work_meeting', 'party', 'call', 'date'],
        defaultIcon: 'social',
        color: '#EC4899', // Pink
    },
    online: {
        type: 'online',
        category: 'social',
        localizationKey: 'event.online',
        subtypes: ['video_call', 'messenger', 'social_media', 'email', 'gaming', 'forum', 'streaming'],
        defaultIcon: 'online',
        color: '#6366F1', // Indigo
    },
    family: {
        type: 'family',
        category: 'social',
        localizationKey: 'event.family',
        subtypes: ['kids', 'parents', 'siblings', 'extended_family', 'pets', 'quality_time'],
        defaultIcon: 'family',
        color: '#F59E0B', // Amber
    },
    partner: {
        type: 'partner',
        category: 'social',
        localizationKey: 'event.partner',
        subtypes: ['date_night', 'conversation', 'intimacy', 'shared_activity', 'support', 'conflict'],
        defaultIcon: 'partner',
        color: '#F97316', // Orange
    },

    // === NOTES (Заметки и события) ===
    note: {
        type: 'note',
        category: 'notes',
        localizationKey: 'event.note',
        defaultIcon: 'note',
        color: '#6B7280', // Gray
    },
    custom: {
        type: 'custom',
        category: 'notes',
        localizationKey: 'event.custom',
        defaultIcon: 'custom',
        color: '#9CA3AF', // Light Gray
    },
    gratitude: {
        type: 'gratitude',
        category: 'notes',
        localizationKey: 'event.gratitude',
        defaultIcon: 'gratitude',
        color: '#FBBF24', // Amber
    },
    idea: {
        type: 'idea',
        category: 'notes',
        localizationKey: 'event.idea',
        defaultIcon: 'idea',
        color: '#A855F7', // Purple
    },
    task: {
        type: 'task',
        category: 'notes',
        localizationKey: 'event.task',
        subtypes: ['priority_low', 'priority_medium', 'priority_high', 'urgent', 'delegated', 'recurring'],
        defaultIcon: 'task',
        color: '#3B82F6', // Blue
    },
    goal: {
        type: 'goal',
        category: 'notes',
        localizationKey: 'event.goal',
        subtypes: ['daily', 'weekly', 'monthly', 'quarterly', 'long_term', 'milestone'],
        defaultIcon: 'goal',
        color: '#10B981', // Emerald
    },
};

/**
 * Категории для группировки в UI
 */
export const EVENT_CATEGORIES: Record<EventCategory, {
    localizationKey: string;
    color: string;
    order: number;
}> = {
    physical: {
        localizationKey: 'category.physical',
        color: '#EF4444',
        order: 1,
    },
    mental: {
        localizationKey: 'category.mental',
        color: '#8B5CF6',
        order: 2,
    },
    activity: {
        localizationKey: 'category.activity',
        color: '#22C55E',
        order: 3,
    },
    social: {
        localizationKey: 'category.social',
        color: '#EC4899',
        order: 4,
    },
    notes: {
        localizationKey: 'category.notes',
        color: '#6B7280',
        order: 5,
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