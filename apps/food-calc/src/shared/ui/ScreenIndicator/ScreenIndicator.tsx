import clsx from 'clsx';
import { NavTile } from '@/shared/ui/NavTile';
import s from './ScreenIndicator.module.scss';

export type TileTitleStyle = 'serif-initial' | 'display-sans' | 'mono-track';

export type ScreenEntry = {
  label: string;
  image?: string;
  titleStyle?: TileTitleStyle;
};

type Props = {
  screens: ScreenEntry[];
  onSelect: (index: number) => void;
  // Один из двух режимов выбора отображаемого экрана:
  // - slideIndex задан → индикатор статично показывает СВОЙ экран
  //   (label/image/highlight). Используется в HomePage, где каждый слайд
  //   Swipeable рендерит свой инстанс; title не прыгает при перелистывании
  //   и Page не зависит от активного индекса (ноль ре-рендеров на свайпе).
  // - slideIndex не задан → fallback на activeIndex (legacy: DishBuilderPage,
  //   один инстанс на странице).
  activeIndex?: number;
  slideIndex?: number;
};

export const ScreenIndicator = ({ screens, activeIndex, onSelect, slideIndex }: Props) => {
  const displayIndex = slideIndex ?? activeIndex ?? 0;
  const activeScreen = screens[displayIndex];
  const activeLabel = activeScreen?.label ?? '';
  const activeImage = activeScreen?.image;
  const total = screens.length;

  return (
    <div
      className={s.root}
      data-screen={displayIndex}
      style={{
        ['--active-idx' as string]: displayIndex,
        ['--tiles-total' as string]: total,
      }}
    >
      {activeImage && (
        <img
          key={activeImage}
          src={activeImage}
          className={s.bandImg}
          alt=""
          aria-hidden
          decoding="async"
        />
      )}
      <div className={s.tilesRow} role="tablist" aria-label="Экран">
        {screens.map((screen, i) => (
          <NavTile
            key={screen.label}
            role="tab"
            aria-selected={false}
            label={screen.label}
            image={screen.image}
            active={screen.label === activeLabel}
            style={{ gridColumnStart: i + 1 }}
            onClick={() => onSelect(i)}
          />
        ))}
      </div>

      <div className={s.band}>
        <span className={clsx([s.bandLabel, s[`bandLabel_${activeScreen.label}`]])}>
          {activeLabel}
        </span>
      </div>
    </div>
  );
};

export default ScreenIndicator;
