import clsx from 'clsx';
import TickIcon from '@/shared/assets/icons/tick.svg?react';
import { Text } from '@/shared/ui/atoms/Typography';
import {
  WALLPAPERS,
  WALLPAPER_SCREENS,
  useWallpaperStore,
  type WallpaperScreen,
} from '@/shared/lib/wallpaper';
import styles from './WallpaperStrip.module.scss';

const screenLabel = (screen: WallpaperScreen) =>
  WALLPAPER_SCREENS.find((s) => s.key === screen)?.label ?? '';

/**
 * WallpaperStrip — горизонтальная лента миниатюр общего каталога для ОДНОГО
 * экрана. Переиспользуемый атом: настройки (WallpaperPicker, строка на экран) и
 * long-press-поповер над обложкой (WallpaperHero) рендерят один и тот же строй.
 * Выбранная миниатюра — чёрная ink-рамка + угловой тик. Пишет/читает
 * `useWallpaperStore`; `className` даёт консументу подстроить края (edge-bleed в
 * дровере).
 */
export const WallpaperStrip = ({
  screen,
  className,
}: {
  screen: WallpaperScreen;
  className?: string;
}) => {
  const selectedId = useWallpaperStore((s) => s.selection[screen]);
  const setWallpaper = useWallpaperStore((s) => s.setWallpaper);

  return (
    <div
      className={clsx(styles.strip, className)}
      role="radiogroup"
      aria-label={`Обои экрана «${screenLabel(screen)}»`}
    >
      {WALLPAPERS.map((w) => {
        const isActive = w.id === selectedId;
        return (
          <button
            key={w.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={w.label}
            className={clsx(styles.thumb, isActive && styles.active)}
            onClick={() => setWallpaper(screen, w.id)}
          >
            <span className={styles.frame}>
              <img
                className={styles.thumbImg}
                src={w.src}
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
              {w.label}
            </Text>
          </button>
        );
      })}
    </div>
  );
};

export default WallpaperStrip;
