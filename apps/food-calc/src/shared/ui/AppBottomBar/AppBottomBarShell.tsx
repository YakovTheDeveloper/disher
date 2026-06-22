import clsx from 'clsx';
import type { CSSProperties } from 'react';
import s from './AppBottomBar.module.scss';

type Props = {
  children: React.ReactNode;
  /**
   * Layout of the shell's children:
   *   - 'left' / 'right' — single CTA, centered.
   *   - 'split' — children laid out space-between (two CTAs, e.g. Laboratory:
   *     analyse + new hypothesis).
   * Defaults to 'left'.
   */
  side?: 'left' | 'right' | 'split';
  /**
   * Optional width of the solo CTA — any CSS length/percentage (e.g. '33%').
   * Default: the CTA fills the bar. When set, the button shrinks to this width
   * and is pinned to `side` (right/left). Ignored for side='split'.
   */
  width?: string;
};

/**
 * Chrome-only counterpart of `AppBottomBar` for slides without the 3-slot food
 * dock (Laboratory, ScheduleEvents). Layout only — the shell paints NO surface
 * (bar background = Screen `.bottomBar` scrim); the buttons inside own their look.
 */
export const AppBottomBarShell = ({ children, side = 'left', width }: Props) => {
  return (
    <div
      className={clsx(s.dock, s.dockV2, s.shellSolo)}
      data-shell-side={side}
      data-shell-fit={width ? 'sized' : undefined}
      style={width ? ({ '--solo-cta-width': width } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
};

export default AppBottomBarShell;
