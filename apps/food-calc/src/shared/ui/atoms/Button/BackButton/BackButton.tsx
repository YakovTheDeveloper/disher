import { memo } from 'react';
import { useViewTransitionNavigate } from '@/shared/lib/viewTransition';
import styles from './BackButton.module.scss';

type Props = {
  /** Storyboard attribute for `useViewTransitionNavigate`. Defaults to the
   *  iOS push-back mirror; AnalysesPage passes `'cover-back'`. */
  type?: string;
  ariaLabel?: string;
} & (
  | {
      /** Destination URL. Back is a PUSH to an explicit URL (NOT history -1):
       *  popstate-back is intentionally not animated by React Router, so we
       *  push the real origin (`state.from`) the caller threaded on the way in. */
      to: string;
      onClick?: never;
    }
  | {
      /** Overlay / multi-step back: run a callback instead of navigating
       *  (SearchFood, ModalByLabel step flows). When set, `to`/`type` don't
       *  apply — the same ‹ affordance, just a non-routing action. */
      onClick: () => void;
      to?: never;
    }
);

// Shared leading-edge back arrow. Lives in the bar's left slot on detail pages
// (product / dish via HomeTopBar.backSlot), in AnalysesTopBar, and in overlay
// headers like SearchFood — one ‹ for the whole app. Inherits the bar's
// floating-pill surface via `--bar-*` tokens where present, falls back to a
// glassy circle where they aren't.
const BackButton = ({ to, onClick, type = 'push-back', ariaLabel = 'Назад' }: Props) => {
  // Rules of Hooks: the navigate hook must run unconditionally. In the onClick
  // variant `to` is '' and the returned navigator is never invoked; the sentinel
  // storyboard type keeps the hook's `data-vt-type` cleanup from ever matching
  // (and clearing) a real push-back transition fired elsewhere.
  const goBack = useViewTransitionNavigate(to ?? '', onClick ? 'noop-back' : type);
  return (
    <button
      type="button"
      className={styles.back}
      onClick={onClick ?? goBack}
      aria-label={ariaLabel}
    >
      ‹
    </button>
  );
};

export default memo(BackButton);
