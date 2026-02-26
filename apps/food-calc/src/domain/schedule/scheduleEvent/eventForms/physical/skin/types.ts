// ============================================================================
// SKIN SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы состояния кожи
 */
export type SkinSubtype =
    | 'acne'           // Акне
    | 'dermatitis'     // Дерматит
    | 'dryness'        // Сухость
    | 'wound'          // Рана
    | 'bruise'         // Синяк
    | 'sunburn'        // Солнечный ожог
    | 'custom';        // Другое

/**
 * Опции подтипов для селекта
 */
export const SKIN_SUBTYPES: { value: SkinSubtype; labelKey: string }[] = [
    { value: 'acne', labelKey: 'subtype.skin.acne' },
    { value: 'dermatitis', labelKey: 'subtype.skin.dermatitis' },
    { value: 'dryness', labelKey: 'subtype.skin.dryness' },
    { value: 'wound', labelKey: 'subtype.skin.wound' },
    { value: 'bruise', labelKey: 'subtype.skin.bruise' },
    { value: 'sunburn', labelKey: 'subtype.skin.sunburn' },
    { value: 'custom', labelKey: 'subtype.skin.custom' },
];
