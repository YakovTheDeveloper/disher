// ============================================================================
// RELAXATION SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы для релаксации
 */
export type RelaxationSubtype =
    | 'breathing'     // Дыхательные упражнения
    | 'stretching'    // Растяжка
    | 'bath'          // Ванна
    | 'reading'       // Чтение
    | 'music'         // Музыка
    | 'massage'       // Массаж
    | 'nature';       // Природа

/**
 * Опции подтипов для селекта
 */
export const RELAXATION_SUBTYPES: { value: RelaxationSubtype; labelKey: string }[] = [
    { value: 'breathing', labelKey: 'subtype.relaxation.breathing' },
    { value: 'stretching', labelKey: 'subtype.relaxation.stretching' },
    { value: 'bath', labelKey: 'subtype.relaxation.bath' },
    { value: 'reading', labelKey: 'subtype.relaxation.reading' },
    { value: 'music', labelKey: 'subtype.relaxation.music' },
    { value: 'massage', labelKey: 'subtype.relaxation.massage' },
    { value: 'nature', labelKey: 'subtype.relaxation.nature' },
];
