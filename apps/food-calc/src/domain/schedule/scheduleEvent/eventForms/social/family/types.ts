// ============================================================================
// FAMILY SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы для семейной активности
 */
export type FamilySubtype =
    | 'kids'          // Дети
    | 'parents'       // Родители
    | 'siblings'      // Братья/сёстры
    | 'extended_family' // Расширенная семья
    | 'pets'          // Питомцы
    | 'quality_time'; // Качественное время

/**
 * Опции подтипов для селекта
 */
export const FAMILY_SUBTYPES: { value: FamilySubtype; labelKey: string }[] = [
    { value: 'kids', labelKey: 'subtype.family.kids' },
    { value: 'parents', labelKey: 'subtype.family.parents' },
    { value: 'siblings', labelKey: 'subtype.family.siblings' },
    { value: 'extended_family', labelKey: 'subtype.family.extended_family' },
    { value: 'pets', labelKey: 'subtype.family.pets' },
    { value: 'quality_time', labelKey: 'subtype.family.quality_time' },
];
