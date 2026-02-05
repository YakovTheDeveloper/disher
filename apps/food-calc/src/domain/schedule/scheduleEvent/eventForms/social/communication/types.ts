// ============================================================================
// SOCIAL (Communication) SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы социальных событий (communication)
 */
export type SocialSubtype =
    | 'friends'       // Встреча с друзьями
    | 'family'        // Семья
    | 'partner'       // Партнёр
    | 'work_meeting'  // Рабочая встреча
    | 'party'         // Вечеринка
    | 'call'          // Звонок
    | 'date';         // Свидание

/**
 * Опции подтипов для селекта
 */
export const SOCIAL_SUBTYPES: { value: SocialSubtype; labelKey: string }[] = [
    { value: 'friends', labelKey: 'subtype.social.friends' },
    { value: 'family', labelKey: 'subtype.social.family' },
    { value: 'partner', labelKey: 'subtype.social.partner' },
    { value: 'work_meeting', labelKey: 'subtype.social.work_meeting' },
    { value: 'party', labelKey: 'subtype.social.party' },
    { value: 'call', labelKey: 'subtype.social.call' },
    { value: 'date', labelKey: 'subtype.social.date' },
];
