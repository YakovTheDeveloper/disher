import clsx from 'clsx';
import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import s from './HomeScreenIndicator.module.scss';

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
 * Exported so callers OUTSIDE `HomeScreenIndicator` (e.g. a separate
 * click-capture layer in `HomePage`) can drive the same animation
 * without duplicating the VT plumbing.
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
 * `--vt-home-duration` / `--vt-home-easing` on `<html>` — currently
 * locked to a back-out overshoot ("bounce"). See `runTileMigration`
 * for the View Transitions transport details.
 */
export const HomeScreenIndicator = ({ screens, activeIndex, onSelect }: Props) => {
  const handleSelect = useCallback(
    (idx: number) => {
      runTileMigration(activeIndex, idx, () => onSelect(idx));
    },
    [activeIndex, onSelect],
  );

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
              onClick={() => handleSelect(i)}
            >
              {screen.image && (
                <img src={screen.image} className={s.tileImg} alt="" aria-hidden />
              )}
              {!active && (
                <span
                  className={s.tileTitle}
                  // `data-vt-name` is the queryable handle for the WAAPI
                  // fallback; `viewTransitionName` (inline style) is the
                  // hook the View Transitions API matches on. Both use
                  // the same identifier so the two transports stay in
                  // sync.
                  data-vt-name={`home-title-${i}`}
                  style={{ viewTransitionName: `home-title-${i}` } as React.CSSProperties}
                >
                  {screen.label}
                </span>
              )}
              {active && (
                // Light-gray serif "shadow" inside the active tile —
                // reads as the bandLabel's projection upward into the
                // tile (source = band immediately below).
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
          data-vt-name={`home-title-${activeIndex}`}
          style={{ viewTransitionName: `home-title-${activeIndex}` } as React.CSSProperties}
        >
          {activeLabel}
        </span>
      </div>
    </div>
  );
};

export default HomeScreenIndicator;
