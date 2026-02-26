// ============================================================================
// ACTIVE RECOVERY SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы активного восстановления
 */
export type ActiveRecoverySubtype =
    | 'stretching_recovery'  // Растяжка для восстановления
    | 'walk_easy'           // Лёгкая прогулка
    | 'breathing_nsdr'      // Дыхание NSDR
    | 'custom';             // Другое

/**
 * Опции подтипов для селекта
 */
export const ACTIVE_RECOVERY_SUBTYPES: { value: ActiveRecoverySubtype; labelKey: string }[] = [
    { value: 'stretching_recovery', labelKey: 'subtype.active_recovery.stretching_recovery' },
    { value: 'walk_easy', labelKey: 'subtype.active_recovery.walk_easy' },
    { value: 'breathing_nsdr', labelKey: 'subtype.active_recovery.breathing_nsdr' },
    { value: 'custom', labelKey: 'subtype.active_recovery.custom' },
];
