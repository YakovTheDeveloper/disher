import type { ReactNode } from 'react';
import { PaperclipIcon } from './PaperclipIcon';
import s from './WriteBarShell.module.scss';

/** `useDesignVariant(...).anchor` — `{ ref, 'data-dv', 'data-dv-v' }`. Spread
 *  onto the button so the DesignBar can target the clip's variant set. */
type DesignAnchor = {
  ref: (el: HTMLElement | null) => void;
  'data-dv': string;
  'data-dv-v': string;
};

export interface WriteBarClipProps {
  onClick: () => void;
  ariaLabel: string;
  /** Number of attached items — shows an accent badge when > 0. */
  count?: number;
  /** Secondary presence-flag (e.g. a clarification is attached) — small dot. */
  dot?: boolean;
  /** Glyph for the button. Defaults to the paperclip (Analysis bar = attach
   *  hypotheses). The Events bar passes a gauge (= rate state). */
  icon?: ReactNode;
  /** Optional DesignBar anchor (spread onto the button) so the icon's variant
   *  set is selectable from the 🎨 bar. */
  anchor?: DesignAnchor;
  /** Disable the affordance (e.g. the Hypotheses bar gates «Подробности» until
   *  there is a title — title-first). Greyed + non-interactive. */
  disabled?: boolean;
}

/**
 * Left affordance for a write bar: a button that opens an attach/rate overlay,
 * with an optional count badge + presence dot. Icon is swappable per bar
 * (paperclip for Analysis hypotheses, gauge for Events scale). Pass as the
 * WriteBarShell `leftSlot`.
 */
export const WriteBarClip = ({
  onClick,
  ariaLabel,
  count = 0,
  dot = false,
  icon = <PaperclipIcon />,
  anchor,
  disabled = false,
}: WriteBarClipProps) => (
  <button
    type="button"
    className={s.clip}
    // preventDefault keeps focus: when the bar is focused, a tap would otherwise
    // blur the input → the row collapses/reflows out from under the finger before
    // the click lands → «nothing happens & the bar closes». Same trick the send
    // coin uses. The click still fires (opens the attach/rate overlay).
    onPointerDown={(e) => e.preventDefault()}
    onClick={onClick}
    aria-label={ariaLabel}
    disabled={disabled}
    {...anchor}
  >
    {icon}
    {count > 0 && <span className={s.clipBadge}>{count}</span>}
    {dot && <span className={s.clipDot} aria-hidden="true" />}
  </button>
);

export default WriteBarClip;
