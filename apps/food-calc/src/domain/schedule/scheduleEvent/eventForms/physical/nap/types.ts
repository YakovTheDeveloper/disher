// ============================================================================
// NAP SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы дневного сна
 */
export type NapSubtype =
    | 'nap_short'      // Короткий сон (Power nap, до 30 мин)
    | 'nap_long'       // Длинный сон (более 30 мин)
    | 'custom';        // Другое

/**
 * Опции подтипов для селекта
 */
export const NAP_SUBTYPES: { value: NapSubtype; labelKey: string }[] = [
    { value: 'nap_short', labelKey: 'subtype.nap.nap_short' },
    { value: 'nap_long', labelKey: 'subtype.nap.nap_long' },
    { value: 'custom', labelKey: 'subtype.nap.custom' },
];
