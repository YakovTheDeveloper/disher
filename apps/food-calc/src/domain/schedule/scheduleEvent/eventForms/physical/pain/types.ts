// ============================================================================
// PAIN SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы боли
 */
export type PainSubtype =
    | 'headache'        // Головная боль
    | 'toothache'       // Зубная боль
    | 'back_pain'       // Боль в спине
    | 'neck_pain'       // Боль в шее
    | 'muscle_pain'     // Мышечная боль
    | 'joint_pain'      // Боль в суставах
    | 'abdominal_pain'  // Боль в животе
    | 'period_pain'     // Менструальная боль
    | 'stomach_pain'    // Боль в желудке
    | 'custom';         // Другое

/**
 * Опции подтипов для селекта
 */
export const PAIN_SUBTYPES: { value: PainSubtype; labelKey: string }[] = [
    { value: 'headache', labelKey: 'subtype.pain.headache' },
    { value: 'toothache', labelKey: 'subtype.pain.toothache' },
    { value: 'back_pain', labelKey: 'subtype.pain.back_pain' },
    { value: 'neck_pain', labelKey: 'subtype.pain.neck_pain' },
    { value: 'muscle_pain', labelKey: 'subtype.pain.muscle_pain' },
    { value: 'joint_pain', labelKey: 'subtype.pain.joint_pain' },
    { value: 'abdominal_pain', labelKey: 'subtype.pain.abdominal_pain' },
    { value: 'period_pain', labelKey: 'subtype.pain.period_pain' },
    { value: 'stomach_pain', labelKey: 'subtype.pain.stomach_pain' },
    { value: 'custom', labelKey: 'subtype.pain.custom' },
];
