import clsx from 'clsx';
import s from './ScreenIndicator.module.scss';

export type TileTitleStyle = 'serif-initial' | 'display-sans' | 'mono-track';

export type ScreenEntry = {
  label: string;
  image?: string;
  titleStyle?: TileTitleStyle;
};

type Props = {
  screens: ScreenEntry[];
  activeIndex: number;
  onSelect: (index: number) => void;
  isActive?: boolean;
  // Если задан — индикатор показывает СВОЙ экран (label/image/highlight)
  // статично, независимо от activeIndex. Используется в HomePage, где
  // каждый слайд Swipeable рендерит свой инстанс ScreenIndicator; title
  // не должен прыгать при перелистывании. Если не задан — fallback на
  // activeIndex (legacy: DishBuilderPage, один инстанс на странице).
  slideIndex?: number;
};

export const ScreenIndicator = ({ screens, activeIndex, onSelect, slideIndex }: Props) => {
  const displayIndex = slideIndex ?? activeIndex;
  const activeScreen = screens[displayIndex];
  const activeLabel = activeScreen?.label ?? '';
  const activeImage = activeScreen?.image;
  const total = screens.length;

  return (
    <div
      className={s.root}
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
        {screens.map((screen, i) => {
          return (
            <button
              key={screen.label}
              type="button"
              role="tab"
              aria-selected={false}
              className={clsx([s.tile, screen.label === activeLabel && s.tileActive])}
              style={{ gridColumnStart: i + 1 }}
              onClick={() => onSelect(i)}
            >
              {screen.image && <img src={screen.image} className={s.tileImg} alt="" aria-hidden />}
              <span className={s.tileTitle}>{screen.label}</span>
            </button>
          );
        })}
      </div>

      <div className={s.band}>
        <span className={s.bandLabel}>{activeLabel}</span>
      </div>
    </div>
  );
};

export default ScreenIndicator;
