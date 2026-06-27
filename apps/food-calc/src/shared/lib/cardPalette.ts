// Единый design-variant ЯКОРЬ палитры карточек — ОДИН контрол в dev-DesignBar
// красит ВСЕ карточные поверхности приложения сразу: еду расписания
// (FoodSchedule), ингредиенты блюда (DishBuilderPage) и события (ScheduleEvents).
//
// Все три зовут `useDesignVariant(CARD_PALETTE_KEY, CARD_PALETTES)` и спредят
// `anchor` на свою обёртку списка; их SCSS включает общий миксин `card-palette-set`
// (design-variant-palettes.scss), который форкается по `data-dv-v`. Значение
// персистится в localStorage по ключу `dv:CardPalette` → выбор на одном экране
// проявляется на всех (общий источник правды, а не три раздельных хардкода).
//
// ⚠️ Значения CARD_PALETTES ДОЛЖНЫ совпадать со строками `&[data-dv-v='…']` в
// `@mixin card-palette-set`. Первый элемент = дефолт (amber — тёплый медовый;
// дефолт `card-palette-set` обязан совпадать).
export const CARD_PALETTE_KEY = 'CardPalette';

// Тёплый натуралист-набор (re-cut 2026-06-27): голос HomePage-гравюры, все
// варианты держат контраст уровня amber/honey + сродство к картинке (ни одного
// холодного — бывшие porcelain/slate выпилены, на их место rust + mauve).
export const CARD_PALETTES = [
  'amber',
  'honey',
  'lemon',
  'sand',
  'clay',
  'rust',
  'rose',
  'mauve',
  'sage',
  'neutral',
] as const;

export type CardPalette = (typeof CARD_PALETTES)[number];
