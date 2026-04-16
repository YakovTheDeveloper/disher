import { FC, ReactNode } from 'react';
import clsx from 'clsx';
import s from './PageHeading.module.scss';

interface PageHeadingProps {
  /** Large faded text behind (optional, like the day number in Navigation) */
  background?: string;
  /** Main title text or ReactNode */
  title: ReactNode;
  /** Small colored subtitle below the title */
  subtitle?: ReactNode;
  /** Called when the title is clicked */
  onTitleClick?: () => void;
  /** Horizontal alignment */
  align?: 'left' | 'right';
  className?: string;
}

const PageHeading: FC<PageHeadingProps> = ({ background, title, subtitle, onTitleClick, align = 'right', className }) => {
  return (
    <div className={clsx(s.wrapper, s[`align_${align}`], className)}>
      <div className={clsx(s.inner, background && s.hasBackground)}>
        {background && <span className={s.background}>{background}</span>}
        <div className={s.overlay}>
          <span
            className={clsx(s.title, onTitleClick && s.titleClickable)}
            onClick={onTitleClick}
          >
            {title}
          </span>
          {subtitle && <span className={s.subtitle}>{subtitle}</span>}
        </div>
      </div>
    </div>
  );
};

export default PageHeading;
