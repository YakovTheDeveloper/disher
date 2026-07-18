import s from './HomeHero.module.scss';
import { useWallpaperSrc, type WallpaperScreen } from '@/shared/lib/wallpaper';
import { WallpaperHero, WallpaperImage } from '@/features/wallpaper';

// Слайд дека → ключ экрана в каталоге обоев. HomePage сейчас 2-слайдовый
// (0 = Рацион, 1 = События); «Открытия» схлопнут в /analyses 2026-07-02.
const SLIDE_TO_SCREEN: Record<number, WallpaperScreen> = {
  0: 'ration',
  1: 'events',
};

/**
 * HomeHero — декоративная гравюра-обложка НАД табами. Картинку каждого слайда
 * выбирает юзер в настройках («Обои», `WallpaperPicker`) — читаем её из
 * `useWallpaperSrc`. Прежний клик-тест-переключатель (перебор HERO_SETS с
 * crossfade'ом) снят: набор стал общим именованным каталогом, а выбор —
 * постоянным. При смене обоев `key={src}` даёт мягкий fade-in новой картинки.
 *
 * z-index НИЖЕ контент-листа (`.headerOverlap`) — лист всегда поверх обложки.
 * `.root` = pointer-events:none, чтобы свайпы по краям ловил Embla ниже; долгий
 * тап по обложке (WallpaperHero) открывает поповер выбора обоев этого экрана.
 */
export const HomeHero = ({ slide = 0 }: { slide?: number }) => {
  const screen = SLIDE_TO_SCREEN[slide] ?? 'ration';
  const src = useWallpaperSrc(screen);

  return (
    <div className={s.root} aria-hidden>
      <WallpaperImage key={src} screen={screen} src={src} className={`${s.heroImg} ${s.fadeIn}`} />
      {/* Логотип Disher — белый masked-PNG, тот же ассет, что у Screen-watermark. */}
      <span className={s.logo} aria-hidden="true" />
      <WallpaperHero screen={screen} />
    </div>
  );
};

export default HomeHero;
