// ============================================================================
// ANGER SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы гнева/внутреннего конфликта
 */
export type AngerSubtype =
    | 'anger'         // Гнев
    | 'resentment'    // Обида
    | 'shame'         // Стыд
    | 'guilt'         // Вина
    | 'custom';       // Другое

/**
 * Опции подтипов для селекта
 */
export const ANGER_SUBTYPES: { value: AngerSubtype; labelKey: string }[] = [
    { value: 'anger', labelKey: 'subtype.anger.anger' },
    { value: 'resentment', labelKey: 'subtype.anger.resentment' },
    { value: 'shame', labelKey: 'subtype.anger.shame' },
    { value: 'guilt', labelKey: 'subtype.anger.guilt' },
    { value: 'custom', labelKey: 'subtype.anger.custom' },
];
