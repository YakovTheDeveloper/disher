// ============================================================================
// ILLNESS SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы физических событий (illness)
 */
export type IllnessSubtype =
    | 'headache'      // Головная боль
    | 'cold'          // Простуда
    | 'fever'         // Жар/температура
    | 'cough'         // Кашель
    | 'nausea'        // Тошнота
    | 'allergy'       // Аллергия
    | 'pain'          // Боль (общая)
    | 'fatigue';      // Усталость/слабость

/**
 * Опции подтипов для селекта
 */
export const ILLNESS_SUBTYPES: { value: IllnessSubtype; labelKey: string }[] = [
    { value: 'headache', labelKey: 'subtype.illness.headache' },
    { value: 'cold', labelKey: 'subtype.illness.cold' },
    { value: 'fever', labelKey: 'subtype.illness.fever' },
    { value: 'cough', labelKey: 'subtype.illness.cough' },
    { value: 'nausea', labelKey: 'subtype.illness.nausea' },
    { value: 'allergy', labelKey: 'subtype.illness.allergy' },
    { value: 'pain', labelKey: 'subtype.illness.pain' },
    { value: 'fatigue', labelKey: 'subtype.illness.fatigue' },
];
