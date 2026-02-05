// ============================================================================
// ACTIVITY TYPES - Tree Structure
// ============================================================================

/**
 * Подтипы активности (плоский тип для обратной совместимости)
 */
export type ActivitySubtype =
    | 'running'           // Бег
    | 'gym'               // Тренажёрный зал
    | 'team_sports'       // Командные виды
    | 'martial_arts'      // Единоборства
    | 'swimming'          // Плавание
    | 'surfing'           // Сёрфинг
    | 'water_skiing'      // Водные лыжи
    | 'hatha_yoga'        // Хатха-йога
    | 'raja_yoga'         // Раджа-йога
    | 'stretching'        // Стретчинг
    | 'pilates'           // Пилатес
    | 'walk'              // Прогулка
    | 'dancing'           // Танцы
    | 'steps'             // Шаги
    | 'games';            // Игры

/**
 * Legacy subtypes for backward compatibility
 */
export type HobbySubtype =
    | 'gaming'
    | 'gardening'
    | 'knitting'
    | 'photography'
    | 'collecting'
    | 'astronomy'
    | 'bird_watching'
    | 'fishing';

export type ChoresSubtype =
    | 'cleaning'
    | 'laundry'
    | 'shopping'
    | 'errands'
    | 'cooking'
    | 'dishwashing'
    | 'organizing'
    | 'home_repair';

export type TransportSubtype =
    | 'walking'
    | 'cycling'
    | 'driving'
    | 'public_transit'
    | 'taxi'
    | 'running';

/**
 * Hobby subtypes options
 */
export const HOBBY_SUBTYPES: { value: HobbySubtype; labelKey: string }[] = [
    { value: 'gaming', labelKey: 'subtype.hobby.gaming' },
    { value: 'gardening', labelKey: 'subtype.hobby.gardening' },
    { value: 'knitting', labelKey: 'subtype.hobby.knitting' },
    { value: 'photography', labelKey: 'subtype.hobby.photography' },
    { value: 'collecting', labelKey: 'subtype.hobby.collecting' },
    { value: 'astronomy', labelKey: 'subtype.hobby.astronomy' },
    { value: 'bird_watching', labelKey: 'subtype.hobby.bird_watching' },
    { value: 'fishing', labelKey: 'subtype.hobby.fishing' },
];

/**
 * Chores subtypes options
 */
export const CHORES_SUBTYPES: { value: ChoresSubtype; labelKey: string }[] = [
    { value: 'cleaning', labelKey: 'subtype.chores.cleaning' },
    { value: 'laundry', labelKey: 'subtype.chores.laundry' },
    { value: 'shopping', labelKey: 'subtype.chores.shopping' },
    { value: 'errands', labelKey: 'subtype.chores.errands' },
    { value: 'cooking', labelKey: 'subtype.chores.cooking' },
    { value: 'dishwashing', labelKey: 'subtype.chores.dishwashing' },
    { value: 'organizing', labelKey: 'subtype.chores.organizing' },
    { value: 'home_repair', labelKey: 'subtype.chores.home_repair' },
];

/**
 * Transport subtypes options
 */
export const TRANSPORT_SUBTYPES: { value: TransportSubtype; labelKey: string }[] = [
    { value: 'walking', labelKey: 'subtype.transport.walking' },
    { value: 'cycling', labelKey: 'subtype.transport.cycling' },
    { value: 'driving', labelKey: 'subtype.transport.driving' },
    { value: 'public_transit', labelKey: 'subtype.transport.public_transit' },
    { value: 'taxi', labelKey: 'subtype.transport.taxi' },
    { value: 'running', labelKey: 'subtype.transport.running' },
];
