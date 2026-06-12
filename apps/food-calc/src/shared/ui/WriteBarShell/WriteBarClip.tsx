import { PaperclipIcon } from './PaperclipIcon';
import s from './WriteBarShell.module.scss';

export interface WriteBarClipProps {
  onClick: () => void;
  ariaLabel: string;
  /** Number of attached items — shows an accent badge when > 0. */
  count?: number;
  /** Secondary presence-flag (e.g. a clarification is attached) — small dot. */
  dot?: boolean;
}

/**
 * Left affordance for a write bar: a paperclip button that opens an attach
 * overlay (hypotheses / atoms), with an optional count badge + presence dot.
 * Pass as the WriteBarShell `leftSlot`.
 */
export const WriteBarClip = ({ onClick, ariaLabel, count = 0, dot = false }: WriteBarClipProps) => (
  <button type="button" className={s.clip} onClick={onClick} aria-label={ariaLabel}>
    <PaperclipIcon />
    {count > 0 && <span className={s.clipBadge}>{count}</span>}
    {dot && <span className={s.clipDot} aria-hidden="true" />}
  </button>
);

export default WriteBarClip;
