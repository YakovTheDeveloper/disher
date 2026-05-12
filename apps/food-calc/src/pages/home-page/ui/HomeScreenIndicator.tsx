import clsx from 'clsx';
import s from './HomeScreenIndicator.module.scss';

export type TileTitleStyle = 'serif-initial' | 'display-sans' | 'mono-track';

export type ScreenEntry = {
  label: string;
  /** Decorative background image, faded inside the tile. */
  image?: string;
  /** Typography style per screen. */
  titleStyle?: TileTitleStyle;
};

type Props = {
  screens: ScreenEntry[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

const TITLE_CLASS: Record<TileTitleStyle, string> = {
  'serif-initial': s.tileTitleSerif,
  'display-sans': s.tileTitleDisplay,
  'mono-track': s.tileTitleMono,
};

/**
 * Tile indicator for the 3 HomePage screens.
 * Active tile = full opacity + scale(1) + black 1px frame; the
 * 1px transparent frame on inactive tiles reserves the layout space
 * so flipping the active state does not shift the row.
 * Animation is composite-only (opacity + transform) — no layout reflow.
 */
export const HomeScreenIndicator = ({ screens, activeIndex, onSelect }: Props) => {
  return (
    <div className={s.tilesRow} role="tablist" aria-label="Экран">
      {screens.map((screen, i) => {
        const active = i === activeIndex;
        const style = screen.titleStyle ?? 'serif-initial';
        const first = screen.label.charAt(0);
        const rest = screen.label.slice(1);
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
            <span className={clsx(s.tileTitle, TITLE_CLASS[style])}>
              <span
                className={clsx(
                  s.tileTitleFirst,
                  style === 'serif-initial' && s.tileTitleFirstEnlarged,
                )}
              >
                {first}
              </span>
              <span className={s.tileTitleRest}>{rest}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default HomeScreenIndicator;
