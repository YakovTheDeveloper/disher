// Палитра карточек приложения — ПЕР-ПОВЕРХНОСТНЫЙ выбор в настройках (ProfileDrawer
// → «Цвет карточек»). Раньше это был ОДИН контрол в dev-DesignBar (общий ключ на
// все поверхности через `useDesignVariant`); теперь выбор постоянный, живёт в
// настройках и РАЗДЕЛЬНЫЙ для каждой поверхности:
//   - `scheduleFood` — еда в расписании (FoodSchedule)
//   - `events`       — события (ScheduleEvents)
//   - `dishFood`     — ингредиенты блюда (DishBuilderPage)
//
// Каждая поверхность читает свою палитру через `useCardPalette(surface)` и спредит
// `data-dv-v={palette}` на свою обёртку списка; её SCSS включает общий миксин
// `card-palette-set` (design-variant-palettes.scss), который форкается по
// `data-dv-v`. Значения персистятся в localStorage (`disher.card-palette`).
//
// ⚠️ Значения CARD_PALETTES ДОЛЖНЫ совпадать со строками `&[data-dv-v='…']` в
// `@mixin card-palette-set`. Дефолт каждой поверхности — amber (первый элемент;
// дефолт `card-palette-set` обязан совпадать).
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

// Человекочитаемые имена палитр (для свотчей в настройках).
export const CARD_PALETTE_LABELS: Record<CardPalette, string> = {
  amber: 'Янтарь',
  honey: 'Мёд',
  lemon: 'Лимон',
  sand: 'Песок',
  clay: 'Терракота',
  rust: 'Рябина',
  rose: 'Роза',
  mauve: 'Слива',
  sage: 'Олива',
  neutral: 'Нейтраль',
};

// Поверхности, которым можно назначить цвет карточек. Карта, а не фикс-набор
// полей — 4-я поверхность (анализ) добавится одним элементом, когда решим её
// красить (сейчас карточки разбора намеренно монохромные — см. AnalysisResult).
export const CARD_SURFACES = ['scheduleFood', 'events', 'dishFood'] as const;

export type CardSurface = (typeof CARD_SURFACES)[number];

export const CARD_SURFACE_LABELS: Record<CardSurface, string> = {
  scheduleFood: 'Еда в расписании',
  events: 'События',
  dishFood: 'Ингредиенты блюда',
};

const DEFAULT_PALETTE: CardPalette = 'amber';

const isCardPalette = (value: unknown): value is CardPalette =>
  typeof value === 'string' && (CARD_PALETTES as readonly string[]).includes(value);

const defaultPalettes = (): Record<CardSurface, CardPalette> =>
  Object.fromEntries(CARD_SURFACES.map((s) => [s, DEFAULT_PALETTE])) as Record<
    CardSurface,
    CardPalette
  >;

type CardPaletteStore = {
  palettes: Record<CardSurface, CardPalette>;
  setPalette: (surface: CardSurface, palette: CardPalette) => void;
};

export const useCardPaletteStore = create<CardPaletteStore>()(
  persist(
    (set) => ({
      palettes: defaultPalettes(),
      setPalette: (surface, palette) =>
        set((state) => ({ palettes: { ...state.palettes, [surface]: palette } })),
    }),
    {
      name: 'disher.card-palette',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Defensive: localStorage may hold a partial/stale shape (missing surface,
      // removed palette). Rebuild from defaults, keep only recognised values.
      migrate: (persisted) => {
        const raw =
          (persisted as { palettes?: Record<string, unknown> } | null)?.palettes ?? {};
        const palettes = defaultPalettes();
        for (const surface of CARD_SURFACES) {
          const value = raw[surface];
          if (isCardPalette(value)) palettes[surface] = value;
        }
        return { palettes } as CardPaletteStore;
      },
    },
  ),
);

/** Palette selected for one surface (defaults to amber). */
export function useCardPalette(surface: CardSurface): CardPalette {
  return useCardPaletteStore((state) => state.palettes[surface] ?? DEFAULT_PALETTE);
}
