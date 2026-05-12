import clsx from 'clsx';
import { getTimeOfDay } from '@/shared/lib/time-of-day';
import { useNow } from '@/shared/lib/time/useNow';
import s from './HomeBottomBar.module.scss';

type Variant = 'dock' | 'segmented';

const VARIANTS: readonly Variant[] = ['dock', 'segmented'];

type Props = {
  variantIndex: number;
  children: React.ReactNode;
  hidden?: boolean;
};

/**
 * Chrome-only counterpart of `HomeBottomBar` for slides without the
 * 3-slot food dock (Laboratory, ScheduleEvents). Same pill/tod-tint
 * surface as variant `dock`; children render centered.
 */
export const HomeBottomBarShell = ({ variantIndex, children, hidden }: Props) => {
  const variant = VARIANTS[variantIndex] ?? VARIANTS[0];
  const tod = getTimeOfDay(useNow());

  return (
    <div
      className={clsx(
        s.dock,
        variant === 'dock' ? s.dockV2 : s.dockV5,
        s.shellSolo,
        hidden && s.hidden,
      )}
      data-tod={tod}
    >
      {children}
    </div>
  );
};

export default HomeBottomBarShell;
