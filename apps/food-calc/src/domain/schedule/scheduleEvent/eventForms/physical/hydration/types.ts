// ============================================================================
// HYDRATION SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы для гидратации
 */
export type HydrationSubtype =
    | 'water'         // Вода
    | 'tea'           // Чай
    | 'coffee'        // Кофе
    | 'juice'         // Сок
    | 'energy_drink'  // Энергетик
    | 'smoothie';     // Смузи

/**
 * Опции подтипов для селекта
 */
export const HYDRATION_SUBTYPES: { value: HydrationSubtype; labelKey: string }[] = [
    { value: 'water', labelKey: 'subtype.hydration.water' },
    { value: 'tea', labelKey: 'subtype.hydration.tea' },
    { value: 'coffee', labelKey: 'subtype.hydration.coffee' },
    { value: 'juice', labelKey: 'subtype.hydration.juice' },
    { value: 'energy_drink', labelKey: 'subtype.hydration.energy_drink' },
    { value: 'smoothie', labelKey: 'subtype.hydration.smoothie' },
];
