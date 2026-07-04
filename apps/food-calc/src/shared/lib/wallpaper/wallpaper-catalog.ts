// Каталог гравюр-обоев (лежат в public/art/hero) + перечень экранов, у которых
// есть настраиваемая hero-обложка. Каталог ПЛОСКИЙ: любую обложку можно назначить
// любому экрану (выбор — в настройках, `WallpaperPicker`). Раньше картинки жили в
// per-screen наборах внутри HomeHero (HERO_SETS) и перебирались кликом-тест-
// переключателем; теперь набор общий и именованный, а выбор постоянный (store).
//
// `id` — стабильный слаг (пишется в localStorage через wallpaper-store); НЕ менять
// у существующих, иначе сохранённый выбор осиротеет и откатится к дефолту.
// Дубли по содержимому свёрнуты в одну запись (hero-auth.jpg ≡ «Городская площадь»).

export type WallpaperId = string;

export interface Wallpaper {
  id: WallpaperId;
  /** Путь от корня public (`/art/hero/...`). */
  src: string;
  /** Человекочитаемое имя — показывается под миниатюрой в пикере. */
  label: string;
}

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'grapes',
    src: '/art/hero/SAAM-1977.99.2_2_screen.jpg',
    label: 'Виноград',
  },
  {
    id: 'lemur',
    src: '/art/hero/NZP-20181114-3807SB_screen.jpg',
    label: 'Лемур и тыква',
  },
  {
    id: 'autumn-forest',
    src: '/art/hero/CHSDM-23644_02-000001_screen.jpg',
    label: 'Осенний лес',
  },
  {
    id: 'high-tide',
    src: '/art/hero/SAAM-1996.63.168_1_screen.jpg',
    label: 'Прилив',
  },
  {
    id: 'hammock',
    src: '/art/hero/SAAM-1996.63.170_1_screen.jpg',
    label: 'Гамак',
  },
  {
    id: 'palms',
    src: '/art/hero/hero-events.jpg',
    label: 'Пальмы на закате',
  },
  {
    id: 'flute',
    src: '/art/hero/CHSDM-259998D64EE22-000001_screen.jpg',
    label: 'Сцена с флейтой',
  },
  {
    id: 'sampler',
    src: '/art/hero/hero-events-2.jpg',
    label: 'Вышивка',
  },
  {
    id: 'gallery',
    src: '/art/hero/NPG-AD_NPG_83_2BradysPhotoGallery-000001_screen.jpg',
    label: 'Галерея портретов',
  },
  {
    id: 'antelopes',
    src: '/art/hero/CHSDM-D24E5D6646192-000001_screen.jpg',
    label: 'Две антилопы',
  },
  {
    id: 'fortress',
    src: '/art/hero/hero-art-1.png',
    label: 'Крепость',
  },
  {
    id: 'square',
    src: '/art/hero/CHSDM-B9FC4D1302062-000001_screen.jpg',
    label: 'Городская площадь',
  },
  {
    id: 'painter',
    src: '/art/hero/NPG-NPG_93_5Russell-000001_screen.jpg',
    label: 'Художник в студии',
  },
  {
    id: 'village-moon',
    src: '/art/hero/CHSDM-6FE1E03EBF6F2-000001_screen.jpg',
    label: 'Деревня под луной',
  },
  {
    id: 'chinese-gallery',
    src: '/art/hero/CHSDM-CHP6573_screen.jpg',
    label: 'Китайская галерея',
  },
  {
    id: 'salon',
    src: '/art/hero/события-1.jpg',
    label: 'Компания за столом',
  },
  {
    id: 'pudding',
    src: '/art/hero/события-2.jpg',
    label: 'Зимний десерт',
  },
  {
    id: 'deer',
    src: '/art/hero/события-3.jpg',
    label: 'Олень в саду',
  },
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
