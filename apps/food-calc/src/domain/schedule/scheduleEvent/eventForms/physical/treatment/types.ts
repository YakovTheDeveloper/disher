// ============================================================================
// TREATMENT SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы лечения/реабилитации
 */
export type TreatmentSubtype =
    | 'physio'          // Физиотерапия
    | 'massage'         // Массаж
    | 'ice_heat'        // Лёд/тепло
    | 'stretch_protocol'// Протокол растяжки
    | 'custom';         // Другое

/**
 * Опции подтипов для селекта
 */
export const TREATMENT_SUBTYPES: { value: TreatmentSubtype; labelKey: string }[] = [
    { value: 'physio', labelKey: 'subtype.treatment.physio' },
    { value: 'massage', labelKey: 'subtype.treatment.massage' },
    { value: 'ice_heat', labelKey: 'subtype.treatment.ice_heat' },
    { value: 'stretch_protocol', labelKey: 'subtype.treatment.stretch_protocol' },
    { value: 'custom', labelKey: 'subtype.treatment.custom' },
];
