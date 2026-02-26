// ============================================================================
// DOCTOR SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы посещения врача/клиники
 */
export type DoctorSubtype =
    | 'appointment'     // Приём
    | 'procedure'       // Процедура
    | 'vaccination'     // Вакцинация
    | 'test_result'     // Результат анализов
    | 'custom';         // Другое

/**
 * Опции подтипов для селекта
 */
export const DOCTOR_SUBTYPES: { value: DoctorSubtype; labelKey: string }[] = [
    { value: 'appointment', labelKey: 'subtype.doctor.appointment' },
    { value: 'procedure', labelKey: 'subtype.doctor.procedure' },
    { value: 'vaccination', labelKey: 'subtype.doctor.vaccination' },
    { value: 'test_result', labelKey: 'subtype.doctor.test_result' },
    { value: 'custom', labelKey: 'subtype.doctor.custom' },
];
