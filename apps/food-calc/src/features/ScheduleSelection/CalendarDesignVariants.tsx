import type { ReactNode } from 'react';
import s from './CalendarDesignVariants.module.scss';

interface VariantProps {
  children: ReactNode;
}

const V1Minimal = ({ children }: VariantProps) => (
  <div className={`${s.variantShell} ${s.v1}`}>
    <div className={s.calendarContent}>{children}</div>
  </div>
);

const V2SpringGlass = ({ children }: VariantProps) => (
  <div className={`${s.variantShell} ${s.v2}`}>
    <div className={s.v2Orbs} aria-hidden>
      <span className={`${s.v2Orb} ${s.v2Orb1}`} />
      <span className={`${s.v2Orb} ${s.v2Orb2}`} />
      <span className={`${s.v2Orb} ${s.v2Orb3}`} />
    </div>
    <div className={s.calendarContent}>{children}</div>
  </div>
);

const V3DarkElegant = ({ children }: VariantProps) => (
  <div className={`${s.variantShell} ${s.v3}`}>
    <div className={s.calendarContent}>{children}</div>
  </div>
);

const V4WarmEditorial = ({ children }: VariantProps) => (
  <div className={`${s.variantShell} ${s.v4}`}>
    <div className={s.v4Stripe} />
    <div className={s.calendarContent}>{children}</div>
  </div>
);

const V5BrutalistMono = ({ children }: VariantProps) => (
  <div className={`${s.variantShell} ${s.v5}`}>
    <div className={s.calendarContent}>{children}</div>
    <div className={s.v5Corner}>DISHER.CAL</div>
  </div>
);

export const CALENDAR_VARIANTS = [V1Minimal, V2SpringGlass, V3DarkElegant, V4WarmEditorial, V5BrutalistMono] as const;

interface CalendarVariantWrapperProps {
  index: number;
  total: number;
  children: ReactNode;
}

export const CalendarVariantWrapper = ({ index, total, children }: CalendarVariantWrapperProps) => {
  const Variant = CALENDAR_VARIANTS[index];
  const isDark = index === 2;

  return (
    <Variant>
      <div className={`${s.badge} ${isDark ? s.badgeDark : ''}`}>
        V{index + 1}/{total}
      </div>
      {children}
    </Variant>
  );
};
