import clsx from 'clsx';
import type { CSSProperties } from 'react';
import { getTimeOfDay } from '@/shared/lib/time-of-day';
import { useNow } from '@/shared/lib/time/useNow';
import s from './AppBottomBar.module.scss';

type Props = {
  children: React.ReactNode;
  /**
   * Layout of the shell's children:
   *   - 'left' / 'right' — single CTA, centered. (The old per-edge TOD-gradient
   *     saturation was removed when the bar surface went to the Screen scrim;
   *     these values now differ only semantically, not visually.)
   *   - 'split' — children laid out space-between (two CTAs, e.g. Laboratory:
   *     analyse + new hypothesis).
   * Defaults to 'left'.
   */
  side?: 'left' | 'right' | 'split';
  /**
   * CTA colour tone. 'default' inherits the time-of-day `--cta-*` tokens
   * (pastel outline pill). 'lemon' overrides them with a solid warm-yellow
   * gradient fill (Events screen empty-state). 'paper' is the white
   * WriteBar-style pill (Events screen once the day has events) — see
   * `[data-cta-tone='lemon'|'paper']` in the SCSS.
   */
  tone?: 'default' | 'lemon' | 'paper';
  /**
   * Optional width of the solo CTA — any CSS length/percentage (e.g. '33%').
   * Default: the CTA fills the bar. When set, the button shrinks to this width
   * and is pinned to `side` (right/left). Ignored for side='split'.
   */
  width?: string;
};

/**
 * Chrome-only counterpart of `AppBottomBar` for slides without the
 * 3-slot food dock (Laboratory, ScheduleEvents). Geometry shared with
 * `.dockV2`; the shell paints NO surface — the bar background is the Screen
 * `.bottomBar` scrim (single source of truth). `data-tod` is still set here
 * so the CTA button inside the shell inherits the same `--cta-*` tokens as
 * WriteFoodButton on screen 2.
 */
export const AppBottomBarShell = ({ children, side = 'left', tone = 'default', width }: Props) => {
  const tod = getTimeOfDay(useNow());

  return (
    <div
      className={clsx(s.dock, s.dockV2, s.shellSolo)}
      data-tod={tod}
      data-shell-side={side}
      data-cta-tone={tone}
      data-shell-fit={width ? 'sized' : undefined}
      style={width ? ({ '--solo-cta-width': width } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
};

export default AppBottomBarShell;
