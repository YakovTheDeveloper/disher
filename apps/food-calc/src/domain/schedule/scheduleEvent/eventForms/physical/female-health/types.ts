// ============================================================================
// FEMALE HEALTH SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы женского здоровья
 */
export type FemaleHealthSubtype =
    | 'cycle_start'    // Начало цикла
    | 'cycle_end'      // Конец цикла
    | 'ovulation'      // Овуляция
    | 'pms'            // ПМС
    | 'spotting'       // Мажущие выделения
    | 'custom';        // Другое

/**
 * Опции подтипов для селекта
 */
export const FEMALE_HEALTH_SUBTYPES: { value: FemaleHealthSubtype; labelKey: string }[] = [
    { value: 'cycle_start', labelKey: 'subtype.female_health.cycle_start' },
    { value: 'cycle_end', labelKey: 'subtype.female_health.cycle_end' },
    { value: 'ovulation', labelKey: 'subtype.female_health.ovulation' },
    { value: 'pms', labelKey: 'subtype.female_health.pms' },
    { value: 'spotting', labelKey: 'subtype.female_health.spotting' },
    { value: 'custom', labelKey: 'subtype.female_health.custom' },
];
