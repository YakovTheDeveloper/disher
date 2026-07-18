import RefreshIcon from '@/shared/assets/icons/refresh.svg?react';
import {
  useWallpaperStore,
  useWallpaperCrop,
  isDefaultCrop,
  WALLPAPER_SCREENS,
  type WallpaperScreen,
} from '@/shared/lib/wallpaper';
import { Button, IconButton } from '@/shared/ui/atoms/Button';

const screenLabel = (screen: WallpaperScreen) =>
  WALLPAPER_SCREENS.find((x) => x.key === screen)?.label ?? '';

/**
 * WallpaperResetButton — «Сбросить» оформление одного экрана. Возвращает экран к
 * ИЗНАЧАЛЬНОМУ виду: и высоту обложки (→ responsive), и кроп (zoom/сдвиг, наведённый
 * pinch-жестом). Задизейблена, пока ни высота, ни кроп не переопределены.
 *
 * Два вида: текстовый (дефолт, ряд «слайдер + Сбросить» в HeroHeightControl
 * горизонтали) и `iconOnly` — голая refresh-плитка без подписи, для правого слота
 * groupHeader'а WallpaperDrawer.
 */
export const WallpaperResetButton = ({
  screen,
  iconOnly = false,
}: {
  screen: WallpaperScreen;
  iconOnly?: boolean;
}) => {
  const height = useWallpaperStore((st) => st.heights[screen]);
  const resetHeroHeight = useWallpaperStore((st) => st.resetHeroHeight);
  const resetCrop = useWallpaperStore((st) => st.resetCrop);
  const crop = useWallpaperCrop(screen);

  const pristine = height == null && isDefaultCrop(crop);
  const onReset = () => {
    resetHeroHeight(screen);
    resetCrop(screen);
  };
  const label = `Сбросить оформление «${screenLabel(screen)}»`;

  if (iconOnly) {
    return (
      <IconButton
        tone="soft"
        size={40}
        icon={<RefreshIcon width={16} height={16} />}
        onClick={onReset}
        disabled={pristine}
        aria-label={label}
      />
    );
  }

  return (
    <Button
      onSurface={2}
      flat
      icon={<RefreshIcon width={16} height={16} />}
      onClick={onReset}
      disabled={pristine}
      aria-label={label}
    >
      Сбросить
    </Button>
  );
};

export default WallpaperResetButton;
