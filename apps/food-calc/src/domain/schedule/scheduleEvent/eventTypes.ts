/**
 * Категории событий расписания
 */
export type EventCategory =
    | 'physical'      // Физическое состояние
    | 'mental'        // Ментальное состояние
    | 'activity'      // Физическая активность
    | 'social'        // Социальная активность
    | 'notes';        // Заметки и события

/**
 * Подтипы физических событий (illness)
 */
export type IllnessSubtype =
    | 'headache'      // Головная боль
    | 'cold'          // Простуда
    | 'fever'         // Жар/температура
    | 'cough'         // Кашель
    | 'nausea'        // Тошнота
    | 'allergy'       // Аллергия
    | 'pain'          // Боль (общая)
    | 'fatigue';      // Усталость/слабость

/**
 * Подтипы пищеварительных событий
 */
export type DigestionSubtype =
    | 'bloating'      // Вздутие
    | 'stomach_pain'  // Боль в желудке
    | 'heartburn'     // Изжога
    | 'constipation'  // Запор
    | 'diarrhea';     // Диарея

/**
 * Подтипы медикаментов
 */
export type MedicationSubtype =
    | 'pill'          // Таблетки
    | 'drops'         // Капли
    | 'injection'     // Инъекции
    | 'syrup'         // Сироп
    | 'topical'       // Наружные средства
    | 'other';        // Другое

/**
 * Подтипы стрессовых событий
 */
export type StressSubtype =
    | 'work'          // Рабочий стресс
    | 'personal'      // Личный стресс
    | 'financial'     // Финансовый стресс
    | 'health'        // Стресс о здоровье
    | 'relationship'; // Стресс в отношениях

/**
 * Подтипы социальных событий
 */
export type SocialSubtype =
    | 'friends'       // Встреча с друзьями
    | 'family'        // Семья
    | 'partner'       // Партнёр
    | 'work_meeting'  // Рабочая встреча
    | 'party'         // Вечеринка
    | 'call'          // Звонок
    | 'date';         // Свидание

/**
 * Подтипы активности
 */
export type ActivitySubtype =
    | 'sport'         // Спорт
    | 'walk'          // Прогулка
    | 'exercise'      // Упражнения
    | 'steps';        // Шаги

/**
 * Все возможные подтипы событий
 */
export type EventSubtype =
    | IllnessSubtype
    | DigestionSubtype
    | MedicationSubtype
    | StressSubtype
    | SocialSubtype
    | ActivitySubtype;

/**
 * Базовые типы событий
 */
export type BaseEventType =
    | 'sleep'
    | 'mood'
    | 'energy'
    | 'stress'
    | 'focus'
    | 'illness'
    | 'digestion'
    | 'medication'
    | 'activity'
    | 'social'
    | 'note'
    | 'custom';

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

    // === ACTIVITY (Физическая активность) ===
    activity: {
        type: 'activity',
        category: 'activity',
        localizationKey: 'event.activity',
        subtypes: ['sport', 'walk', 'exercise', 'steps'],
        defaultIcon: 'activity',
        color: '#22C55E', // Green
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