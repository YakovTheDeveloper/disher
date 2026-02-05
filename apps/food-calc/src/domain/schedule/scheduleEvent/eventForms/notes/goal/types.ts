// ============================================================================
// GOAL SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы для целей
 */
export type GoalSubtype =
    | 'daily'         // Дневная
    | 'weekly'        // Недельная
    | 'monthly'       // Месячная
    | 'quarterly'     // Квартальная
    | 'long_term'     // Долгосрочная
    | 'milestone';    // Веха

/**
 * Опции подтипов для селекта
 */
export const GOAL_SUBTYPES: { value: GoalSubtype; labelKey: string }[] = [
    { value: 'daily', labelKey: 'subtype.goal.daily' },
    { value: 'weekly', labelKey: 'subtype.goal.weekly' },
    { value: 'monthly', labelKey: 'subtype.goal.monthly' },
    { value: 'quarterly', labelKey: 'subtype.goal.quarterly' },
    { value: 'long_term', labelKey: 'subtype.goal.long_term' },
    { value: 'milestone', labelKey: 'subtype.goal.milestone' },
];
