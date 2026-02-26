// ============================================================================
// WORK SOCIAL SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы рабочего социального взаимодействия
 */
export type WorkSocialSubtype =
    | 'team_bonding'   // Командное сплочение
    | 'conflict'       // Конфликт
    | 'feedback'       // Обратная связь
    | 'custom';        // Другое

/**
 * Опции подтипов для селекта
 */
export const WORK_SOCIAL_SUBTYPES: { value: WorkSocialSubtype; labelKey: string }[] = [
    { value: 'team_bonding', labelKey: 'subtype.work_social.team_bonding' },
    { value: 'conflict', labelKey: 'subtype.work_social.conflict' },
    { value: 'feedback', labelKey: 'subtype.work_social.feedback' },
    { value: 'custom', labelKey: 'subtype.work_social.custom' },
];
