import { useId, type ReactNode } from 'react';
import clsx from 'clsx';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import s from './WriteBarMedal.module.scss';

export interface WriteBarMedalProps {
  /** Focuses this input id on tap (ModalByLabel idiom) — opens the linked overlay. */
  htmlFor: string;
  ariaLabel: string;
  /** Center engraving as a raster png (Food bar). */
  img?: string;
  /** Center glyph as a node (e.g. an icon) — alternative to `img` (Analysis bar). */
  centerNode?: ReactNode;
  /** Upper arc caption. */
  arcTop?: string;
  /** Lower arc caption. */
  arcBottom?: string;
  /** Quiet/dimmed state (Food ready-state): no lift shadow + faded. */
  dimmed?: boolean;
  /** Nudge the coin up a touch above the pill centre (Food bar — «приподнятая» кнопка). */
  lifted?: boolean;
  /**
   * Float over the pill's right edge (default, absolute anchor to `[data-write-bar]`)
   * vs sit IN FLOW (set `false`) — e.g. inside a tall bar's trailing slot, where it
   * reserves its own width and never collapses on focus.
   */
  floating?: boolean;
}

/**
 * Round coin/stamp affordance at the right edge of a WriteBarShell pill: a
 * `<label htmlFor>` (focus delegation opens the linked manager/catalog) drawn as
 * a medal — center glyph + two arc captions. Collapses when the row is expanded.
 */
export const WriteBarMedal = ({
  htmlFor,
  ariaLabel,
  img,
  centerNode,
  arcTop,
  arcBottom,
  dimmed,
  lifted,
  floating = true,
}: WriteBarMedalProps) => {
  const { pressed, pressProps } = usePressFeedback();
  // Unique ids for the SVG arc paths (textPath references them by #id).
  const arcBase = useId().replace(/:/g, '');
  const arcTopId = `${arcBase}-t`;
  const arcBotId = `${arcBase}-b`;

  return (
    <label
      htmlFor={htmlFor}
      className={clsx(s.writeBarList, lifted && s.lifted)}
      aria-label={ariaLabel}
      data-pressed={pressed || undefined}
      data-dim={dimmed || undefined}
      data-inline={!floating || undefined}
      {...pressProps}
    >
      {img ? (
        <img src={img} className={s.writeBarListImg} alt="" aria-hidden />
      ) : centerNode ? (
        <span className={s.writeBarListCenter} aria-hidden>
          {centerNode}
        </span>
      ) : null}
      {(arcTop || arcBottom) && (
        <svg className={s.writeBarListArc} viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <path id={arcTopId} d="M 14,50 A 36,36 0 0 1 86,50" fill="none" />
            <path id={arcBotId} d="M 3,50 A 47,47 0 0 0 97,50" fill="none" />
          </defs>
          {arcTop && (
            <text>
              <textPath href={`#${arcTopId}`} startOffset="50%" textAnchor="middle">
                {arcTop}
              </textPath>
            </text>
          )}
          {arcBottom && (
            <text>
              <textPath href={`#${arcBotId}`} startOffset="50%" textAnchor="middle">
                {arcBottom}
              </textPath>
            </text>
          )}
        </svg>
      )}
    </label>
  );
};

export default WriteBarMedal;
