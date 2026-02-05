// ============================================================================
// MEDITATION SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы для медитации
 */
export type MeditationSubtype =
    | 'mindfulness'   // Осознанность
    | 'guided'        // Направляемая
    | 'body_scan'     // Сканирование тела
    | 'yoga_nidra'    // Йога-нидра
    | 'loving_kindness' // Любящая доброта
    | 'transcendental'; // Трансцендентальная

/**
 * Опции подтипов для селекта
 */
export const MEDITATION_SUBTYPES: { value: MeditationSubtype; labelKey: string }[] = [
    { value: 'mindfulness', labelKey: 'subtype.meditation.mindfulness' },
    { value: 'guided', labelKey: 'subtype.meditation.guided' },
    { value: 'body_scan', labelKey: 'subtype.meditation.body_scan' },
    { value: 'yoga_nidra', labelKey: 'subtype.meditation.yoga_nidra' },
    { value: 'loving_kindness', labelKey: 'subtype.meditation.loving_kindness' },
    { value: 'transcendental', labelKey: 'subtype.meditation.transcendental' },
];
