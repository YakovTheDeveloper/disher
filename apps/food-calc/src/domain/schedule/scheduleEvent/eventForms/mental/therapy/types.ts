// ============================================================================
// THERAPY SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы терапии/коучинга
 */
export type TherapySubtype =
    | 'session'       // Сессия
    | 'homework'      // Домашнее задание
    | 'breakthrough'  // Прорыв
    | 'custom';       // Другое

/**
 * Опции подтипов для селекта
 */
export const THERAPY_SUBTYPES: { value: TherapySubtype; labelKey: string }[] = [
    { value: 'session', labelKey: 'subtype.therapy.session' },
    { value: 'homework', labelKey: 'subtype.therapy.homework' },
    { value: 'breakthrough', labelKey: 'subtype.therapy.breakthrough' },
    { value: 'custom', labelKey: 'subtype.therapy.custom' },
];
