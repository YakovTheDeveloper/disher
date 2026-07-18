import type { BaseDrawerProps } from '@/shared/ui/overlay-types';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ActionList } from '@/shared/ui/ActionList';
import { FormLayout } from '@/shared/ui/form/FormLayout';
import { HintButton } from '@/shared/ui/HintButton';
import { WALLPAPER_SCREENS, type WallpaperScreen } from '@/shared/lib/wallpaper';
import { type CardSurface } from '@/shared/lib/cardPalette';
import { WallpaperStrip } from './WallpaperStrip';
import { CardColorStrip } from './CardColorStrip';
import { HeroHeightControl } from './HeroHeightControl';
import { WallpaperResetButton } from './WallpaperResetButton';
import { Text } from '@/shared/ui/atoms/Typography';
import s from './WallpaperDrawer.module.scss';

const screenLabel = (screen: WallpaperScreen) =>
  WALLPAPER_SCREENS.find((x) => x.key === screen)?.label ?? '';

// Экран обоев → поверхность цвета карточек. У «Разборов» карточки намеренно
// монохромны (нет поверхности в CARD_SURFACES) → карусель цвета не показываем.
const SCREEN_TO_SURFACE: Partial<Record<WallpaperScreen, CardSurface>> = {
  ration: 'scheduleFood',
  events: 'events',
  dish: 'dishFood',
};

interface Props extends BaseDrawerProps {
  screen: WallpaperScreen;
}

/**
 * WallpaperDrawer — нижний дровер оформления ОДНОГО экрана («Стиль · <экран>»):
 * высота обложки + обои + цвет карточек секции. Открывается long-press'ом по
 * обложке (WallpaperHero). Первая группа «Масштабирование» (FormLayout.Group):
 * groupHeader = лейбл + «Сбросить» иконкой справа (WallpaperResetButton `iconOnly`),
 * контент = подсказка про жесты, под ней горизонтальный трек высоты обложки
 * (HeroHeightControl, `showReset={false}`). Вторая секция «Обложка, цвет карточек» — лента обоев
 * над лентой цвета. Пока дровер открыт, обложку можно приблизить/подвинуть пальцами
 * (WallpaperHero, `interactiveBehind`). ⓘ в шапке (HintButton) объясняет это.
 * Закрытие — крест / свайп вниз / фон; `onClose` не нужен.
 */
export const WallpaperDrawer = ({ screen }: Props) => {
  const surface = SCREEN_TO_SURFACE[screen];
  return (
    <DrawerLayout
      title={`Стиль · ${screenLabel(screen)}`}
      scrollHints={false}
      topRight={
        <HintButton
          ariaLabel="Что здесь можно менять"
          hint="Здесь — высота обложки, её кадр и цвет карточек этого экрана. Пока панель открыта, картинку можно приблизить и подвинуть двумя пальцами прямо на экране — как в галерее."
        />
      }
    >
      <ActionList>
        <FormLayout.Group
          label="Масштабирование"
          trailing={<WallpaperResetButton screen={screen} iconOnly />}
        >
          <div className={s.scaleRow}>
            <Text role="caption" className={s.scaleCaption}>
              Жестами по обложке на экране можно менять положение и масштаб картинки (pinch/drag).
              Слайдер ниже меняет высоту обложки, не трогая кадр и масштаб картинки.
            </Text>
            <HeroHeightControl screen={screen} showReset={false} />
          </div>
        </FormLayout.Group>

        <ActionList.Section label="Обложка, цвет карточек" as="h3">
          <div className={s.strips}>
            <WallpaperStrip screen={screen} layout="row" />
            {surface && <CardColorStrip surface={surface} />}
          </div>
        </ActionList.Section>
      </ActionList>
    </DrawerLayout>
  );
};

export default WallpaperDrawer;
