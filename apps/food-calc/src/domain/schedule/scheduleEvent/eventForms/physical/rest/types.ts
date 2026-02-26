// ============================================================================
// REST SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы отдыха
 */
export type RestSubtype =
    | 'lying_down'     // Лёжа
    | 'doing_nothing'  // Безделье
    | 'spa_bath'       // SPA/ванна
    | 'custom';        // Другое

/**
 * Опции подтипов для селекта
 */
export const REST_SUBTYPES: { value: RestSubtype; labelKey: string }[] = [
    { value: 'lying_down', labelKey: 'subtype.rest.lying_down' },
    { value: 'doing_nothing', labelKey: 'subtype.rest.doing_nothing' },
    { value: 'spa_bath', labelKey: 'subtype.rest.spa_bath' },
    { value: 'custom', labelKey: 'subtype.rest.custom' },
];
