// ============================================================================
// VITALS SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы для измерений (vitals)
 */
export type VitalsSubtype =
    | 'blood_pressure'   // Артериальное давление
    | 'heart_rate'       // Пульс
    | 'temperature'      // Температура
    | 'blood_sugar'      // Уровень сахара в крови
    | 'oxygen';          // Уровень кислорода

/**
 * Опции подтипов для селекта
 */
export const VITALS_SUBTYPES: { value: VitalsSubtype; labelKey: string }[] = [
    { value: 'blood_pressure', labelKey: 'subtype.vitals.blood_pressure' },
    { value: 'heart_rate', labelKey: 'subtype.vitals.heart_rate' },
    { value: 'temperature', labelKey: 'subtype.vitals.temperature' },
    { value: 'blood_sugar', labelKey: 'subtype.vitals.blood_sugar' },
    { value: 'oxygen', labelKey: 'subtype.vitals.oxygen' },
];
