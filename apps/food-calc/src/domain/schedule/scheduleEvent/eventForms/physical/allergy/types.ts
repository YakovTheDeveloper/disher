// ============================================================================
// ALLERGY SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы аллергии
 */
export type AllergySubtype =
    | 'rhinitis'         // Ринит (насморк)
    | 'itching'          // Зуд
    | 'rash'            // Сыпь
    | 'watery_eyes'      // Слезящиеся глаза
    | 'asthma_like'      // Астмаподобные симптомы
    | 'custom';          // Другое

/**
 * Опции подтипов для селекта
 */
export const ALLERGY_SUBTYPES: { value: AllergySubtype; labelKey: string }[] = [
    { value: 'rhinitis', labelKey: 'subtype.allergy.rhinitis' },
    { value: 'itching', labelKey: 'subtype.allergy.itching' },
    { value: 'rash', labelKey: 'subtype.allergy.rash' },
    { value: 'watery_eyes', labelKey: 'subtype.allergy.watery_eyes' },
    { value: 'asthma_like', labelKey: 'subtype.allergy.asthma_like' },
    { value: 'custom', labelKey: 'subtype.allergy.custom' },
];
