import { ScaleSlider } from '@/shared/ui/ScaleSlider';
import { WallpaperResetButton } from './WallpaperResetButton';
import {
  useWallpaperStore,
  responsiveHeroHeight,
  HERO_HEIGHT_MIN,
  HERO_HEIGHT_MAX,
  WALLPAPER_SCREENS,
  type WallpaperScreen,
} from '@/shared/lib/wallpaper';
import s from './HeroHeightControl.module.scss';

const screenLabel = (screen: WallpaperScreen) =>
  WALLPAPER_SCREENS.find((x) => x.key === screen)?.label ?? '';

/**
 * HeroHeightControl — горизонтальный трек высоты обложки одного экрана. Пишет в
 * `useWallpaperStore.heights[screen]`, откуда SwipeDeck драйвит `--deck-hero-h`
 * слайда; дефолт (null) → трек показывает responsive-высоту, число намеренно
 * скрыто (`hideValue`) — важен жест-растяжка, а не пиксели.
 *
 * `showReset` (деф. true) рисует инлайн-«Сбросить» справа от слайдера — так в
 * настройках «Внешний вид» (WallpaperPicker). В WallpaperDrawer сброс переехал в
 * groupHeader (`WallpaperResetButton iconOnly`), поэтому там `showReset={false}`,
 * чтобы кнопка не двоилась.
 */
export const HeroHeightControl = ({
  screen,
  showReset = true,
}: {
  screen: WallpaperScreen;
  showReset?: boolean;
}) => {
  const height = useWallpaperStore((st) => st.heights[screen]);
  const setHeroHeight = useWallpaperStore((st) => st.setHeroHeight);

  const value = height ?? responsiveHeroHeight();

  return (
    <div className={s.row}>
      <ScaleSlider
        value={value}
        min={HERO_HEIGHT_MIN}
        max={HERO_HEIGHT_MAX}
        hideValue
        onChange={(v) => setHeroHeight(screen, v)}
        ariaLabel={`Высота обложки «${screenLabel(screen)}»`}
        className={s.slider}
      />
      {showReset && <WallpaperResetButton screen={screen} />}
    </div>
  );
};

export default HeroHeightControl;
