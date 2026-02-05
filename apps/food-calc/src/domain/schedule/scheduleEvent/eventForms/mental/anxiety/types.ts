// ============================================================================
// ANXIETY SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы для тревожности
 */
export type AnxietySubtype =
    | 'mild'          // Лёгкая
    | 'moderate'      // Умеренная
    | 'severe'        // Сильная
    | 'panic'         // Паника
    | 'general'       // Генерализованная
    | 'social';       // Социальная

/**
 * Опции подтипов для селекта
 */
export const ANXIETY_SUBTYPES: { value: AnxietySubtype; labelKey: string }[] = [
    { value: 'mild', labelKey: 'subtype.anxiety.mild' },
    { value: 'moderate', labelKey: 'subtype.anxiety.moderate' },
    { value: 'severe', labelKey: 'subtype.anxiety.severe' },
    { value: 'panic', labelKey: 'subtype.anxiety.panic' },
    { value: 'general', labelKey: 'subtype.anxiety.general' },
    { value: 'social', labelKey: 'subtype.anxiety.social' },
];
