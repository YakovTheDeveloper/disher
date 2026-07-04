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

// Выбор обоев per-screen. Зеркалит user-theme-store (Zustand persist +
// localStorage + migrate-guard + version): выбор per-device, НЕ синкается на
// сервер (чисто оформление). Дефолты — из каталога (`WALLPAPER_DEFAULTS`).

type Selection = Record<WallpaperScreen, WallpaperId>;

const defaultSelection = (): Selection => ({ ...WALLPAPER_DEFAULTS });

// Санитайзер: чинит сохранённый объект — каждый экран должен иметь ВАЛИДНЫЙ id
// (существующий в каталоге). Незнакомый/удалённый id или отсутствующий ключ →
// дефолт этого экрана. Лишние ключи отбрасываются (пересобираем по списку экранов).
const sanitize = (raw: unknown): Selection => {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out = defaultSelection();
  for (const { key } of WALLPAPER_SCREENS) {
    const v = src[key];
    if (isWallpaperId(v)) out[key] = v;
  }
  return out;
};

interface WallpaperStore {
  selection: Selection;
  setWallpaper: (screen: WallpaperScreen, id: WallpaperId) => void;
}

export const useWallpaperStore = create<WallpaperStore>()(
  persist(
    (set) => ({
      selection: defaultSelection(),
      setWallpaper: (screen, id) =>
        set((state) =>
          // Игнорируем неизвестный id (защита от рассинхрона каталога).
          isWallpaperId(id)
            ? { selection: { ...state.selection, [screen]: id } }
            : state,
        ),
    }),
    {
      name: 'disher.wallpaper',
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => {
        const p = persisted as { selection?: unknown } | null;
        return { selection: sanitize(p?.selection) } as WallpaperStore;
      },
      version: 1,
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
