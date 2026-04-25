import styles from './Typography.module.scss';
import clsx from 'clsx';
import { forwardRef } from 'react';

type Props = {
  children: React.ReactNode;
  variant: 'action' | 'info' | 'elegant' | 'custom' | 'feature-title' | 'feature-title-s';
  ellipsis?: boolean;
  className?: string;
  onClick?: () => void;
  onTouchEnd?: () => void;
  maxChars?: number;
  after?: React.ReactNode;
  as?: 'p' | 'label';
  htmlFor?: string;
};

type ExposedRefs = {
  container: HTMLParagraphElement | null;
  measure: HTMLSpanElement | null;
};

const Typography = forwardRef<ExposedRefs, Props>(
  (
    { children, variant, ellipsis, className, onClick, onTouchEnd, after, as = 'p', htmlFor },
    _ref
  ) => {
    const isCustom = variant === 'custom';
    const Tag = as;

    return (
      <>
        <Tag
          onClick={onClick}
          onTouchEnd={onTouchEnd}
          className={clsx(
            styles.container,
            !isCustom && styles[variant],
            ellipsis && styles.ellipsis,
            className
          )}
          {...(as === 'label' && htmlFor ? { htmlFor } : {})}
        >
          {children}
          {after}
        </Tag>
      </>
    );
  }
);

Typography.displayName = 'Typography';

export default Typography;
