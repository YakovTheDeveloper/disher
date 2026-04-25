import type { ReactNode } from 'react';
import s from './CalendarDesignVariants.module.scss';
import { shouldShowDvBar } from '@/app/ui/DesignVariantsBar';

interface VariantProps {
  children: ReactNode;
}

const V1IOSDark = ({ children }: VariantProps) => (
  <div className={`${s.variantShell} ${s.v1ios}`}>
    <div className={s.calendarContent}>{children}</div>
  </div>
);

export const CALENDAR_VARIANTS = [V1IOSDark] as const;

interface CalendarVariantWrapperProps {
  index: number;
  total: number;
  children: ReactNode;
}

export const CalendarVariantWrapper = ({ index, total, children }: CalendarVariantWrapperProps) => {
  const Variant = CALENDAR_VARIANTS[index] ?? V1IOSDark;

  return (
    <Variant>
      {shouldShowDvBar() && (
        <div className={`${s.badge} ${s.badgeDark}`}>
          V{index + 1}/{total}
        </div>
      )}
      {children}
    </Variant>
  );
};
