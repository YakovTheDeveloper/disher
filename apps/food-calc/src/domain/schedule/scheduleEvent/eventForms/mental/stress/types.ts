// ============================================================================
// STRESS SUBTYPES AND TYPES
// ============================================================================

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
 * Опции подтипов для селекта
 */
export const STRESS_SUBTYPES: { value: StressSubtype; labelKey: string }[] = [
    { value: 'work', labelKey: 'subtype.stress.work' },
    { value: 'personal', labelKey: 'subtype.stress.personal' },
    { value: 'financial', labelKey: 'subtype.stress.financial' },
    { value: 'health', labelKey: 'subtype.stress.health' },
    { value: 'relationship', labelKey: 'subtype.stress.relationship' },
];
