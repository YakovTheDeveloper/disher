// ============================================================================
// MEDICATION SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы медикаментов
 */
export type MedicationSubtype =
    | 'pill'          // Таблетки
    | 'drops'         // Капли
    | 'injection'     // Инъекции
    | 'syrup'         // Сироп
    | 'topical'       // Наружные средства
    | 'other';        // Другое

/**
 * Опции подтипов для селекта
 */
export const MEDICATION_SUBTYPES: { value: MedicationSubtype; labelKey: string }[] = [
    { value: 'pill', labelKey: 'subtype.medication.pill' },
    { value: 'drops', labelKey: 'subtype.medication.drops' },
    { value: 'injection', labelKey: 'subtype.medication.injection' },
    { value: 'syrup', labelKey: 'subtype.medication.syrup' },
    { value: 'topical', labelKey: 'subtype.medication.topical' },
    { value: 'other', labelKey: 'subtype.medication.other' },
];
