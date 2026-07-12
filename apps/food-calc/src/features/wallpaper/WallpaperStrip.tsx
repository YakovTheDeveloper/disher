import { useEffect } from 'react';
import clsx from 'clsx';
import useEmblaCarousel from 'embla-carousel-react';
import TickIcon from '@/shared/assets/icons/tick.svg?react';
import { Text } from '@/shared/ui/atoms/Typography';
import {
  WALLPAPERS,
  WALLPAPER_SCREENS,
  useWallpaperStore,
  type Wallpaper,
  type WallpaperScreen,
} from '@/shared/lib/wallpaper';
import styles from './WallpaperStrip.module.scss';

const screenLabel = (screen: WallpaperScreen) =>
  WALLPAPER_SCREENS.find((s) => s.key === screen)?.label ?? '';

// Раскладка `columns`: миниатюры бьются на столбики по 2 (пара = один Embla-слайд),
// зеркалит CardPalettePicker — «Цвет карточек». Плотнее, чем плоская лента.
const COLUMN_SIZE = 2;
const chunk = <T,>(arr: readonly T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};
const WALLPAPER_COLUMNS = chunk(WALLPAPERS, COLUMN_SIZE);

const Thumb = ({
  wallpaper,
  isActive,
  onSelect,
}: {
  wallpaper: Wallpaper;
  isActive: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={isActive}
    aria-label={wallpaper.label}
    className={clsx(styles.thumb, isActive && styles.active)}
    onClick={onSelect}
  >
    <span className={styles.frame}>
      <img
        className={styles.thumbImg}
        src={wallpaper.src}
        alt=""
        loading="lazy"
        decoding="async"
        width={96}
        height={64}
      />
      {/* Маркер «выбрано» = холодный тик в светлой плашке-«наклейке»
          в правом-верхнем углу (модель Choice.marker). */}
      <span className={styles.tick} aria-hidden>
        <TickIcon />
      </span>
    </span>
    <Text as="span" role="caption" className={styles.thumbLabel}>
      {wallpaper.label}
    </Text>
  </button>
);

type StripProps = {
  screen: WallpaperScreen;
  className?: string;
  selectedId: string | undefined;
  setWallpaper: (screen: WallpaperScreen, id: string) => void;
};

const RowStrip = ({ screen, className, selectedId, setWallpaper }: StripProps) => (
  <div
    className={clsx(styles.strip, className)}
    role="radiogroup"
    aria-label={`Обои экрана «${screenLabel(screen)}»`}
  >
    {WALLPAPERS.map((w) => (
      <Thumb
        key={w.id}
        wallpaper={w}
        isActive={w.id === selectedId}
        onSelect={() => setWallpaper(screen, w.id)}
      />
    ))}
  </div>
);

const ColumnStrip = ({ screen, className, selectedId, setWallpaper }: StripProps) => {
  // Слайдер = Embla (тот же движок, что в CardPalettePicker / ScheduleNavigator).
  // `.viewport` = Embla-root (overflow hidden), `.track` = Embla-container.
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'x',
    loop: false,
    containScroll: 'trimSnaps',
    dragFree: true,
    watchResize: true,
  });

  // Дровер въезжает анимацией — на первом кадре Embla снимает кривую ширину слайда.
  // Переснимаем после первого paint'а (тот же rAF-reInit, что в CardPalettePicker).
  useEffect(() => {
    if (!emblaApi) return;
    const id = requestAnimationFrame(() => emblaApi.reInit());
    return () => cancelAnimationFrame(id);
  }, [emblaApi]);

  return (
    <div className={clsx(styles.viewport, className)} ref={emblaRef}>
      <div
        className={styles.track}
        role="radiogroup"
        aria-label={`Обои экрана «${screenLabel(screen)}»`}
      >
        {WALLPAPER_COLUMNS.map((column, i) => (
          <div key={i} className={styles.column}>
            {column.map((w) => (
              <Thumb
                key={w.id}
                wallpaper={w}
                isActive={w.id === selectedId}
                onSelect={() => setWallpaper(screen, w.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * WallpaperStrip — миниатюры общего каталога для ОДНОГО экрана. Переиспользуемый
 * атом с двумя раскладками: `row` (плоская горизонтальная лента — long-press
 * поповер над обложкой) и `columns` (столбики по 2 в Embla-слайдере — настройки
 * «Внешний вид», зеркалит «Цвет карточек» / CardPalettePicker). Выбранная
 * миниатюра — чёрная ink-рамка + угловой тик. Пишет/читает `useWallpaperStore`;
 * `className` даёт консументу подстроить края (edge-bleed в дровере).
 */
export const WallpaperStrip = ({
  screen,
  className,
  layout = 'row',
}: {
  screen: WallpaperScreen;
  className?: string;
  layout?: 'row' | 'columns';
}) => {
  const selectedId = useWallpaperStore((s) => s.selection[screen]);
  const setWallpaper = useWallpaperStore((s) => s.setWallpaper);

  const Strip = layout === 'columns' ? ColumnStrip : RowStrip;
  return (
    <Strip
      screen={screen}
      className={className}
      selectedId={selectedId}
      setWallpaper={setWallpaper}
    />
  );
};

export default WallpaperStrip;
