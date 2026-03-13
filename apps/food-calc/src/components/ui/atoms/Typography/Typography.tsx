import { observer } from 'mobx-react-lite';
import styles from './Typography.module.scss';
import clsx from 'clsx';
import { forwardRef, useImperativeHandle, useRef } from 'react';

type Props = {
  children: React.ReactNode;
  variant: 'action' | 'info' | 'elegant' | 'custom' | 'feature-title';
  ellipsis?: boolean;
  className?: string;
  onClick?: () => void;
  onTouchEnd?: () => void;
  maxChars?: number;
  after?: React.ReactNode;
};

type ExposedRefs = {
  container: HTMLParagraphElement | null;
  measure: HTMLSpanElement | null;
};

const Typography = forwardRef<ExposedRefs, Props>(
  ({ children, variant, ellipsis, className, onClick, onTouchEnd, after }, ref) => {
    const isCustom = variant === 'custom';

    return (
      <>
        <p
          onClick={onClick}
          onTouchEnd={onTouchEnd}
          className={clsx(
            styles.container,
            !isCustom && styles[variant],
            ellipsis && styles.ellipsis,
            className
          )}
        >
          {children}
          {after}
        </p>
      </>
    );
  }
);

Typography.displayName = 'Typography';

export default observer(Typography);
