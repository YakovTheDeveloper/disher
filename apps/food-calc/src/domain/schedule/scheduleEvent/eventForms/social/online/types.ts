// ============================================================================
// ONLINE SUBTYPES AND TYPES
// ============================================================================

/**
 * Подтипы для онлайн активности
 */
export type OnlineSubtype =
    | 'video_call'    // Видеозвонок
    | 'messenger'     // Мессенджер
    | 'social_media'  // Соцсети
    | 'email'         // Почта
    | 'gaming'        // Игры онлайн
    | 'forum'         // Форум
    | 'streaming';    // Стриминг

/**
 * Опции подтипов для селекта
 */
export const ONLINE_SUBTYPES: { value: OnlineSubtype; labelKey: string }[] = [
    { value: 'video_call', labelKey: 'subtype.online.video_call' },
    { value: 'messenger', labelKey: 'subtype.online.messenger' },
    { value: 'social_media', labelKey: 'subtype.online.social_media' },
    { value: 'email', labelKey: 'subtype.online.email' },
    { value: 'gaming', labelKey: 'subtype.online.gaming' },
    { value: 'forum', labelKey: 'subtype.online.forum' },
    { value: 'streaming', labelKey: 'subtype.online.streaming' },
];
