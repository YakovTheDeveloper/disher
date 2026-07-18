import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  WALLPAPER_DEFAULTS,
  WALLPAPER_SCREENS,
  WALLPAPER_BY_ID,
  isWallpaperId,
  type WallpaperId,
  type WallpaperScreen,
} from './wallpaper-catalog';

// Выбор обоев + высота обложки per-screen. Зеркалит user-theme-store (Zustand
// persist + localStorage + migrate-guard + version): всё per-device, НЕ синкается
// на сервер (чисто оформление). Дефолты обоев — из каталога (`WALLPAPER_DEFAULTS`);
// высота по умолчанию — `null` (отдаём responsive-клэмп `--deck-hero-h` в CSS).

type Selection = Record<WallpaperScreen, WallpaperId>;
// null = высота не переопределена → hero держит responsive-дефолт (CSS clamp).
// Число = явная высота обложки этого экрана в px (перекрывает `--deck-hero-h`).
type Heights = Record<WallpaperScreen, number | null>;

// Кроп обложки: uniform-зум + сдвиг (px) от центра, живой pinch/pan-жестом по hero
// (WallpaperHero) пока открыт WallpaperDrawer. Постоянный, per-device (как height).
// scale=1 ⇒ обложка в дефолтном cover-кадре; сдвиг осмыслен только при scale>1.
export type WallpaperCrop = { scale: number; x: number; y: number };
type Crops = Record<WallpaperScreen, WallpaperCrop>;

// Границы зума. MIN=1 — ниже cover не отдаляем (иначе оголятся края); MAX=3 —
// потолок разумного приближения гравюры.
export const HERO_ZOOM_MIN = 1;
export const HERO_ZOOM_MAX = 3;
const DEFAULT_CROP: WallpaperCrop = { scale: 1, x: 0, y: 0 };

const defaultSelection = (): Selection => ({ ...WALLPAPER_DEFAULTS });
const defaultHeights = (): Heights =>
  Object.fromEntries(WALLPAPER_SCREENS.map(({ key }) => [key, null])) as Heights;
const defaultCrops = (): Crops =>
  Object.fromEntries(WALLPAPER_SCREENS.map(({ key }) => [key, { ...DEFAULT_CROP }])) as Crops;

const clampScale = (n: number): number =>
  Math.min(HERO_ZOOM_MAX, Math.max(HERO_ZOOM_MIN, n));

// Нормализация кропа: scale в [MIN,MAX]; при scale=1 сдвиг обнуляется (панорама
// осмыслена только на приближении). Пределы сдвига по осям зависят от размера
// hero (недоступен здесь) — их держит сам жест; тут только защита scale=1 ⇒ 0.
const normalizeCrop = (c: WallpaperCrop): WallpaperCrop => {
  const scale = clampScale(c.scale);
  if (scale <= HERO_ZOOM_MIN) return { scale: HERO_ZOOM_MIN, x: 0, y: 0 };
  return { scale, x: c.x, y: c.y };
};

export const isDefaultCrop = (c: WallpaperCrop): boolean =>
  c.scale === HERO_ZOOM_MIN && c.x === 0 && c.y === 0;

// Границы слайдера высоты. `RESPONSIVE_MIN`/`RATIO` совпадают с CSS-клэмпом
// `clamp(200px, 43svh, 460px)` в SwipeDeck.module.scss — так число слайдера в
// покое (null) равно фактической высоте, и первый драг не даёт скачка.
export const HERO_HEIGHT_MIN = 160;
export const HERO_HEIGHT_MAX = 460;
const HERO_RESPONSIVE_MIN = 200;
const HERO_HEIGHT_RATIO = 0.43;

const clampHeight = (n: number): number =>
  Math.min(HERO_HEIGHT_MAX, Math.max(HERO_HEIGHT_MIN, Math.round(n)));

/**
 * Число высоты для слайдера, когда экран на дефолте (null): повторяет CSS-клэмп
 * `clamp(200px, 43svh, 460px)` по текущему `innerHeight`. Не реактивно к resize —
 * это лишь стартовая точка контрола, фактическую responsive-высоту держит CSS.
 */
export const responsiveHeroHeight = (): number => {
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  return Math.round(
    Math.min(HERO_HEIGHT_MAX, Math.max(HERO_RESPONSIVE_MIN, HERO_HEIGHT_RATIO * vh)),
  );
};

// Санитайзер обоев: каждый экран → ВАЛИДНЫЙ id каталога, иначе дефолт экрана.
const sanitize = (raw: unknown): Selection => {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out = defaultSelection();
  for (const { key } of WALLPAPER_SCREENS) {
    const v = src[key];
    if (isWallpaperId(v)) out[key] = v;
  }
  return out;
};

// Санитайзер высот: конечное число → клэмп в [MIN, MAX]; всё прочее → null (responsive).
const sanitizeHeights = (raw: unknown): Heights => {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out = defaultHeights();
  for (const { key } of WALLPAPER_SCREENS) {
    const v = src[key];
    if (typeof v === 'number' && Number.isFinite(v)) out[key] = clampHeight(v);
  }
  return out;
};

// Санитайзер кропов: валидные числа → normalizeCrop; всё прочее → дефолт экрана.
const sanitizeCrops = (raw: unknown): Crops => {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out = defaultCrops();
  const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  for (const { key } of WALLPAPER_SCREENS) {
    const v = src[key];
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      out[key] = normalizeCrop({ scale: num(o.scale) || 1, x: num(o.x), y: num(o.y) });
    }
  }
  return out;
};

interface WallpaperStore {
  selection: Selection;
  heights: Heights;
  crops: Crops;
  setWallpaper: (screen: WallpaperScreen, id: WallpaperId) => void;
  setHeroHeight: (screen: WallpaperScreen, px: number) => void;
  resetHeroHeight: (screen: WallpaperScreen) => void;
  setCrop: (screen: WallpaperScreen, crop: WallpaperCrop) => void;
  resetCrop: (screen: WallpaperScreen) => void;
}

export const useWallpaperStore = create<WallpaperStore>()(
  persist(
    (set) => ({
      selection: defaultSelection(),
      heights: defaultHeights(),
      crops: defaultCrops(),
      setWallpaper: (screen, id) =>
        set((state) =>
          // Игнорируем неизвестный id (защита от рассинхрона каталога).
          isWallpaperId(id)
            ? { selection: { ...state.selection, [screen]: id } }
            : state,
        ),
      setHeroHeight: (screen, px) =>
        set((state) => ({ heights: { ...state.heights, [screen]: clampHeight(px) } })),
      resetHeroHeight: (screen) =>
        set((state) => ({ heights: { ...state.heights, [screen]: null } })),
      setCrop: (screen, crop) =>
        set((state) => ({ crops: { ...state.crops, [screen]: normalizeCrop(crop) } })),
      resetCrop: (screen) =>
        set((state) => ({ crops: { ...state.crops, [screen]: { ...DEFAULT_CROP } } })),
    }),
    {
      name: 'disher.wallpaper',
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => {
        const p = persisted as
          | { selection?: unknown; heights?: unknown; crops?: unknown }
          | null;
        return {
          selection: sanitize(p?.selection),
          heights: sanitizeHeights(p?.heights),
          crops: sanitizeCrops(p?.crops),
        } as WallpaperStore;
      },
      version: 3,
    },
  ),
);

/**
 * Реактивный src выбранной для экрана обложки (для heroes). Всегда валиден —
 * несуществующий id откатывается к дефолту экрана.
 */
export const useWallpaperSrc = (screen: WallpaperScreen): string =>
  useWallpaperStore((s) => {
    const id = s.selection[screen] ?? WALLPAPER_DEFAULTS[screen];
    return (WALLPAPER_BY_ID[id] ?? WALLPAPER_BY_ID[WALLPAPER_DEFAULTS[screen]]).src;
  });

/** Реактивный кроп (zoom+сдвиг) обложки экрана — для hero-картинки. */
export const useWallpaperCrop = (screen: WallpaperScreen): WallpaperCrop =>
  useWallpaperStore((s) => s.crops[screen]);
