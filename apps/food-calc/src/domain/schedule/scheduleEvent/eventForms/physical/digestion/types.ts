// ============================================================================
// DIGESTION SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы пищеварительных событий
 */
export type DigestionSubtype =
    | 'bloating'      // Вздутие
    | 'stomach_pain'  // Боль в желудке
    | 'heartburn'     // Изжога
    | 'constipation'  // Запор
    | 'diarrhea';     // Диарея

/**
 * Опции подтипов для селекта
 */
export const DIGESTION_SUBTYPES: { value: DigestionSubtype; labelKey: string }[] = [
    { value: 'bloating', labelKey: 'subtype.digestion.bloating' },
    { value: 'stomach_pain', labelKey: 'subtype.digestion.stomach_pain' },
    { value: 'heartburn', labelKey: 'subtype.digestion.heartburn' },
    { value: 'constipation', labelKey: 'subtype.digestion.constipation' },
    { value: 'diarrhea', labelKey: 'subtype.digestion.diarrhea' },
];
