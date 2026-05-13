import clsx from 'clsx';
import { flushSync } from 'react-dom';
import s from './ScreenIndicator.module.scss';

export type TileTitleStyle = 'serif-initial' | 'display-sans' | 'mono-track';

export type ScreenEntry = {
  label: string;
  /** Decorative background image, faded inside the tile. */
  image?: string;
  /** Retained for back-compat with HomePage's SCREENS array; the migrate
   *  behaviour overrides typography so source (tile) and destination
   *  (band) are identical and the morph reads as one growing word. */
  titleStyle?: TileTitleStyle;
};

type Props = {
  screens: ScreenEntry[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

/**
 * Wrap a state mutation so the title morph (tile ↔ band) animates.
 * Exported so callers OUTSIDE `ScreenIndicator` (e.g. a separate
 * click-capture layer) can drive the same animation without
 * duplicating the VT plumbing.
 *
 * Uses the **View Transitions API** — Chrome 111+, Safari 18.2+, FF 144+.
 * On browsers without VT support (iOS Safari <18.2) the state just
 * changes instantly without animation.
 *
 * `commit` must perform the state change synchronously when called —
 * `flushSync` wraps it so React commits before the second snapshot.
 */
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

/**
 * Tile indicator with shared-element title migration. Timing reads from
 * `--vt-screen-duration` / `--vt-screen-easing` on `<html>` — currently
 * locked to a back-out overshoot ("bounce"). See `runTileMigration`
 * for the View Transitions transport details.
 *
 * NB: HomePage перекрывает эти кнопки невидимым click-layer'ом и сам
 * оборачивает коммит в `runTileMigration`. Поэтому `onClick` здесь —
 * raw commit без VT-обёртки (она бы дала double-VT, если бы кликам
 * удалось добраться до этих кнопок).
 */
export const ScreenIndicator = ({ screens, activeIndex, onSelect }: Props) => {
  const activeLabel = screens[activeIndex]?.label ?? '';

  return (
    <div className={s.root}>
      <div className={s.tilesRow} role="tablist" aria-label="Экран">
        {screens.map((screen, i) => {
          const active = i === activeIndex;
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
              {!active && (
                <span
                  className={s.tileTitle}
                  data-vt-name={`screen-title-${i}`}
                  style={{ viewTransitionName: `screen-title-${i}` } as React.CSSProperties}
                >
                  {screen.label}
                </span>
              )}
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
        <span
          className={s.bandLabel}
          data-vt-name={`screen-title-${activeIndex}`}
          style={{ viewTransitionName: `screen-title-${activeIndex}` } as React.CSSProperties}
        >
          {activeLabel}
        </span>
      </div>
    </div>
  );
};

export default ScreenIndicator;
