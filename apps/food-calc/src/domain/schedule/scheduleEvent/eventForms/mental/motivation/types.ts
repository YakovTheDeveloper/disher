// ============================================================================
// MOTIVATION SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы мотивации
 */
export type MotivationSubtype =
    | 'inspired'         // Вдохновлён
    | 'resistant'        // Сопротивление
    | 'procrastinating'  // Прокрастинация
    | 'custom';          // Другое

/**
 * Опции подтипов для селекта
 */
export const MOTIVATION_SUBTYPES: { value: MotivationSubtype; labelKey: string }[] = [
    { value: 'inspired', labelKey: 'subtype.motivation.inspired' },
    { value: 'resistant', labelKey: 'subtype.motivation.resistant' },
    { value: 'procrastinating', labelKey: 'subtype.motivation.procrastinating' },
    { value: 'custom', labelKey: 'subtype.motivation.custom' },
];
