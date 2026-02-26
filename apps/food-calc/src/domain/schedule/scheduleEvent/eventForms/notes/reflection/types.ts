// ============================================================================
// REFLECTION SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы рефлексии
 */
export type ReflectionSubtype =
    | 'daily_review'     // Ежедневный обзор
    | 'lesson_learned'   // Извлечённый урок
    | 'decision_log'     // Журнал решений
    | 'custom';          // Другое

/**
 * Опции подтипов для селекта
 */
export const REFLECTION_SUBTYPES: { value: ReflectionSubtype; labelKey: string }[] = [
    { value: 'daily_review', labelKey: 'subtype.reflection.daily_review' },
    { value: 'lesson_learned', labelKey: 'subtype.reflection.lesson_learned' },
    { value: 'decision_log', labelKey: 'subtype.reflection.decision_log' },
    { value: 'custom', labelKey: 'subtype.reflection.custom' },
];
