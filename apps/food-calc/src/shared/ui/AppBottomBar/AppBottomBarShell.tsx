import clsx from 'clsx';
import { getTimeOfDay } from '@/shared/lib/time-of-day';
import { useNow } from '@/shared/lib/time/useNow';
import s from './AppBottomBar.module.scss';

// Surface palettes for the shell variants — picked manually from
// DesignVariantsBar (key: `HomeBottomBarBg`). The data attribute lives on
// a HomePage ancestor; the shell itself stays palette-agnostic.
export const APP_BOTTOM_BAR_BG_VARIANTS = [
  'column-stripe',
  'stripe-warm',
  'stripe-lavender',
] as const;
export type AppBottomBarBgVariant = (typeof APP_BOTTOM_BAR_BG_VARIANTS)[number];

type Props = {
  children: React.ReactNode;
  hidden?: boolean;
};

/**
 * Chrome-only counterpart of `AppBottomBar` for slides without the
 * 3-slot food dock (Laboratory, ScheduleEvents). Geometry shared with
 * `.dockV2`; surface is a horizontal gradient + fading top hairline,
 * palette switched via `[data-dv='HomeBottomBarBg']` on a HomePage
 * ancestor. `data-tod` is set here so the CTA button inside the shell
 * inherits the same `--cta-*` tokens as WriteFoodButton on screen 2.
 */
export const AppBottomBarShell = ({ children, hidden }: Props) => {
  const tod = getTimeOfDay(useNow());

  return (
    <div
      className={clsx(s.dock, s.dockV2, s.shellSolo, hidden && s.hidden)}
      data-tod={tod}
    >
      {children}
    </div>
  );
};

export default AppBottomBarShell;
