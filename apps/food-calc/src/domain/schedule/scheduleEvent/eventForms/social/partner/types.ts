// ============================================================================
// PARTNER SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы для партнёрской активности
 */
export type PartnerSubtype =
    | 'date_night'    // Свидание
    | 'conversation'  // Разговор
    | 'intimacy'      // Интимность
    | 'shared_activity' // Совместное занятие
    | 'support'       // Поддержка
    | 'conflict';     // Конфликт

/**
 * Опции подтипов для селекта
 */
export const PARTNER_SUBTYPES: { value: PartnerSubtype; labelKey: string }[] = [
    { value: 'date_night', labelKey: 'subtype.partner.date_night' },
    { value: 'conversation', labelKey: 'subtype.partner.conversation' },
    { value: 'intimacy', labelKey: 'subtype.partner.intimacy' },
    { value: 'shared_activity', labelKey: 'subtype.partner.shared_activity' },
    { value: 'support', labelKey: 'subtype.partner.support' },
    { value: 'conflict', labelKey: 'subtype.partner.conflict' },
];
