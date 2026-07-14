// Каталог гравюр-обоев (лежат в public/art/hero) + перечень экранов, у которых
// есть настраиваемая hero-обложка. Каталог ПЛОСКИЙ: любую обложку можно назначить
// любому экрану (выбор — в настройках, `WallpaperPicker`). Раньше картинки жили в
// per-screen наборах внутри HomeHero (HERO_SETS) и перебирались кликом-тест-
// переключателем; теперь набор общий и именованный, а выбор постоянный (store).
//
// `id` — стабильный слаг (пишется в localStorage через wallpaper-store); НЕ менять
// у существующих, иначе сохранённый выбор осиротеет и откатится к дефолту.
// Дубли по содержимому свёрнуты в одну запись (бывший hero-auth.jpg ≡ «Городская площадь»).
//
// Пути ВЫВОДЯТСЯ из id: `scripts/gen-wallpaper-assets.mjs` кладёт ассеты именно под
// слагом (`/art/hero/grapes.webp` + `/art/hero/thumb/grapes.webp`). Оригиналы живут в
// art-src/hero/ — вне public, чтобы 7 MB исходников не уезжали в dist.

export type WallpaperId = string;

export interface Wallpaper {
  id: WallpaperId;
  /** Полноразмерная обложка для hero-экранов. */
  src: string;
  /** 192×128 (2× DPR) для миниатюры пикера — ~5 KB против ~400 KB у `src`. */
  thumb: string;
  /** Человекочитаемое имя — показывается под миниатюрой в пикере. */
  label: string;
}

const wallpaper = (id: WallpaperId, label: string): Wallpaper => ({
  id,
  label,
  src: `/art/hero/${id}.webp`,
  thumb: `/art/hero/thumb/${id}.webp`,
});

export const WALLPAPERS: Wallpaper[] = [
  wallpaper('grapes', 'Виноград'),
  wallpaper('lemur', 'Лемур и тыква'),
  wallpaper('autumn-forest', 'Осенний лес'),
  wallpaper('high-tide', 'Прилив'),
  wallpaper('hammock', 'Гамак'),
  wallpaper('palms', 'Пальмы на закате'),
  wallpaper('flute', 'Сцена с флейтой'),
  wallpaper('sampler', 'Вышивка'),
  wallpaper('gallery', 'Галерея портретов'),
  wallpaper('antelopes', 'Две антилопы'),
  wallpaper('fortress', 'Крепость'),
  wallpaper('square', 'Городская площадь'),
  wallpaper('painter', 'Художник в студии'),
  wallpaper('village-moon', 'Деревня под луной'),
  wallpaper('chinese-gallery', 'Китайская галерея'),
  wallpaper('salon', 'Компания за столом'),
  wallpaper('pudding', 'Зимний десерт'),
  wallpaper('deer', 'Олень в саду'),
];

export const WALLPAPER_BY_ID: Record<WallpaperId, Wallpaper> = Object.fromEntries(
  WALLPAPERS.map((w) => [w.id, w]),
);

export const isWallpaperId = (value: unknown): value is WallpaperId =>
  typeof value === 'string' && value in WALLPAPER_BY_ID;

// ─── Экраны с настраиваемой обложкой ────────────────────────────────────────
// `key` — стабильный ключ (пишется в store). `label` — имя раздела в пикере.
//   ration   — home-слайд «Рацион» (HomeHero slide 0)
//   events   — home-слайд «События» (HomeHero slide 1)
//   analyses — экран «Разборы» (AnalysesHero)
//   dish     — конструктор блюда (DishHero, DishBuilderPage)
export const WALLPAPER_SCREENS = [
  { key: 'ration', label: 'Рацион' },
  { key: 'dish', label: 'Блюдо' },
  { key: 'events', label: 'События' },
  { key: 'analyses', label: 'Разборы' },
] as const;

export type WallpaperScreen = (typeof WALLPAPER_SCREENS)[number]['key'];

// Дефолтная обложка каждого экрана — совпадает с тематикой раздела; `analyses`
// сохраняет прежний статичный дефолт AnalysesHero (галерея портретов).
export const WALLPAPER_DEFAULTS: Record<WallpaperScreen, WallpaperId> = {
  ration: 'grapes',
  dish: 'lemur',
  events: 'high-tide',
  analyses: 'gallery',
};
