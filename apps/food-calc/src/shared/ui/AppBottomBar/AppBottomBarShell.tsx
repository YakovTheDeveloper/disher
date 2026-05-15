import clsx from 'clsx';
import { getTimeOfDay } from '@/shared/lib/time-of-day';
import { useNow } from '@/shared/lib/time/useNow';
import s from './AppBottomBar.module.scss';

type Props = {
  children: React.ReactNode;
  hidden?: boolean;
  /**
   * Which edge of the home swipe the gradient should be saturated on:
   *   - 'left'  — saturated TOD tint → transparent (leftmost screen)
   *   - 'right' — transparent → saturated TOD tint (rightmost screen)
   *   - 'split' — symmetric tint on both edges; children laid out
   *     space-between (two CTAs, e.g. Laboratory: analyse + new hypothesis).
   * Defaults to 'left'.
   */
  side?: 'left' | 'right' | 'split';
};

/**
 * Chrome-only counterpart of `AppBottomBar` for slides without the
 * 3-slot food dock (Laboratory, ScheduleEvents). Geometry shared with
 * `.dockV2`; surface is a TOD-driven horizontal gradient — saturation
 * sits on the matching edge of the home swipe (see `side`). `data-tod`
 * is set here so the CTA button inside the shell inherits the same
 * `--cta-*` tokens as WriteFoodButton on screen 2.
 */
export const AppBottomBarShell = ({ children, hidden, side = 'left' }: Props) => {
  const tod = getTimeOfDay(useNow());

  return (
    <div
      className={clsx(s.dock, s.dockV2, s.shellSolo, hidden && s.hidden)}
      data-tod={tod}
      data-shell-side={side}
    >
      {children}
    </div>
  );
};

export default AppBottomBarShell;
