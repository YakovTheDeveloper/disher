import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Пользовательский выбор оформления витрины нутриентов (экран «Настройки →
// Внешний вид → Нутриенты», 2026-07-25). Две ортогональные оси:
//   hero  — форма верхней макро-секции: 'boxes' (ведомость 3×2), 'circles'
//           (кольца D1), 'raw' (без hero — макро рендерится такими же плотными
//           карточками, как микро-группы хвоста);
//   track — прогресс-трек карточек (плотных рядов): 'inCell' (рельс в ячейке
//           нормы, дефолт), 'fullWidth' (рельс на всю ширину под рядом),
//           'fill' (фон-заливка карточки), 'none' (без трека, только числа).
// Живёт в localStorage, читается витриной NutrientTotals сразу — как обои и
// палитра карточек.
export const NUTRIENT_HERO_VARIANTS = ['boxes', 'circles', 'raw'] as const;
export type NutrientHeroVariant = (typeof NUTRIENT_HERO_VARIANTS)[number];

export const NUTRIENT_TRACK_VARIANTS = ['inCell', 'fullWidth', 'fill', 'none'] as const;
export type NutrientTrackVariant = (typeof NUTRIENT_TRACK_VARIANTS)[number];

const DEFAULT_HERO: NutrientHeroVariant = 'boxes';
const DEFAULT_TRACK: NutrientTrackVariant = 'inCell';

const isHero = (v: unknown): v is NutrientHeroVariant =>
  typeof v === 'string' && (NUTRIENT_HERO_VARIANTS as readonly string[]).includes(v);
const isTrack = (v: unknown): v is NutrientTrackVariant =>
  typeof v === 'string' && (NUTRIENT_TRACK_VARIANTS as readonly string[]).includes(v);

interface NutrientAppearanceStore {
  hero: NutrientHeroVariant;
  track: NutrientTrackVariant;
  setHero: (hero: NutrientHeroVariant) => void;
  setTrack: (track: NutrientTrackVariant) => void;
}

export const useNutrientAppearanceStore = create<NutrientAppearanceStore>()(
  persist(
    (set) => ({
      hero: DEFAULT_HERO,
      track: DEFAULT_TRACK,
      setHero: (hero) => set({ hero }),
      setTrack: (track) => set({ track }),
    }),
    {
      name: 'disher.nutrient-appearance',
      storage: createJSONStorage(() => localStorage),
      // Defensive: stale/garbage persisted values fall back to defaults.
      migrate: (persisted) => {
        const p = persisted as Partial<NutrientAppearanceStore> | undefined;
        return {
          hero: isHero(p?.hero) ? p.hero : DEFAULT_HERO,
          track: isTrack(p?.track) ? p.track : DEFAULT_TRACK,
        } as NutrientAppearanceStore;
      },
      version: 1,
    },
  ),
);
