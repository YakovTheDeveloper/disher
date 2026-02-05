// ============================================================================
// CREATIVITY SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы для творчества
 */
export type CreativitySubtype =
    | 'drawing'       // Рисование
    | 'writing'       // Письмо
    | 'music'         // Музыка
    | 'crafts'        // Ремесла
    | 'cooking'       // Готовка
    | 'photography'   // Фотография
    | 'diy';          // Сделай сам

/**
 * Опции подтипов для селекта
 */
export const CREATIVITY_SUBTYPES: { value: CreativitySubtype; labelKey: string }[] = [
    { value: 'drawing', labelKey: 'subtype.creativity.drawing' },
    { value: 'writing', labelKey: 'subtype.creativity.writing' },
    { value: 'music', labelKey: 'subtype.creativity.music' },
    { value: 'crafts', labelKey: 'subtype.creativity.crafts' },
    { value: 'cooking', labelKey: 'subtype.creativity.cooking' },
    { value: 'photography', labelKey: 'subtype.creativity.photography' },
    { value: 'diy', labelKey: 'subtype.creativity.diy' },
];
