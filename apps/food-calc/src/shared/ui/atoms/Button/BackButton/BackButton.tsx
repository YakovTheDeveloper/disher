import { memo } from 'react';
import { useViewTransitionNavigate } from '@/shared/lib/viewTransition';
import styles from './BackButton.module.scss';

type Props = {
  /** Destination URL. Back is a PUSH to an explicit URL (NOT history -1):
   *  popstate-back is intentionally not animated by React Router, so we
   *  push the real origin (`state.from`) the caller threaded on the way in. */
  to: string;
  /** Storyboard attribute for `useViewTransitionNavigate`. Defaults to the
   *  iOS push-back mirror; AnalysesPage passes `'cover-back'`. */
  type?: string;
  ariaLabel?: string;
};

// Shared leading-edge back arrow. Lives in the bar's left slot on detail pages
// (product / dish via HomeTopBar.backSlot) and in AnalysesTopBar — one ‹ for
// the whole app. Inherits the bar's floating-pill surface via `--bar-*` tokens
// where present, falls back to a glassy circle where they aren't.
const BackButton = ({ to, type = 'push-back', ariaLabel = 'Назад' }: Props) => {
  const goBack = useViewTransitionNavigate(to, type);
  return (
    <button type="button" className={styles.back} onClick={goBack} aria-label={ariaLabel}>
      ‹
    </button>
  );
};

export default memo(BackButton);
