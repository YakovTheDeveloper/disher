import clsx from 'clsx';
import { flushSync } from 'react-dom';
import s from './ScreenIndicator.module.scss';

export type TileTitleStyle = 'serif-initial' | 'display-sans' | 'mono-track';

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

// Сохранён ради обратной совместимости с DishBuilderPage. В HomePage
// больше не используется: tiles анимируются только opacity-transition'ом.
export const runTileMigration = (
  prevIdx: number,
  idx: number,
  commit: () => void,
): void => {
  const startVT = (document as DocWithVT).startViewTransition;
  if (idx === prevIdx || typeof startVT !== 'function') {
    commit();
    return;
  }
  startVT.call(document, () => {
    flushSync(commit);
  });
};

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

export const ScreenIndicator = ({
  screens,
  activeIndex,
  onSelect,
  slideIndex,
}: Props) => {
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
          const active = i === displayIndex;
          return (
            <button
              key={screen.label}
              type="button"
              role="tab"
              aria-selected={active}
              className={clsx(s.tile, active && s.tileActive)}
              onClick={() => onSelect(i)}
            >
              {screen.image && (
                <img src={screen.image} className={s.tileImg} alt="" aria-hidden />
              )}
              {!active && <span className={s.tileTitle}>{screen.label}</span>}
              {active && (
                <span className={s.tileShadow} aria-hidden>
                  {screen.label}
                </span>
              )}
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
