import styles from './Screen.module.scss';
import clsx from 'clsx';
import { useRef, memo } from 'react';
import { useScrollBottomIndicator } from '@/hooks/useScrollBottomIndicator';
import { ScrollIndicator } from '@/shared/ui/ScrollIndicator';

type Props = {
  children: React.ReactNode;
  actions?: React.ReactNode;
  bottomRight?: React.ReactNode;
  bottomLeft?: React.ReactNode;
  topPanel?: React.ReactNode;
  header?: React.ReactNode;
  offsetTop?: boolean | React.ReactNode;
  title?: React.ReactNode;
  backgroundColor?: 'gray' | 'white';
  className?: string;
  overlay?: React.ReactNode;
  backgroundImage?: string;
  backgroundImageOpacity?: number;
};

const Screen = ({
  header,
  children,
  bottomRight,
  bottomLeft,
  topPanel,
  actions,
  backgroundColor,
  className,
  offsetTop,
  overlay,
  backgroundImage,
  backgroundImageOpacity = 0.05,
}: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { sentinelRef, hasMoreBelow } = useScrollBottomIndicator(scrollContainerRef);

  return (
    <div
      className={clsx(styles.screen, backgroundColor && styles[`bg-${backgroundColor}`], className)}
    >
      {backgroundImage && (
        <img
          src={backgroundImage}
          className={styles.backgroundImage}
          style={{ opacity: backgroundImageOpacity }}
          alt=""
        />
      )}
      <div className={styles.screenScroll} ref={scrollContainerRef}>
        <div className={styles.topPanel}>{topPanel}</div>
        {header}
        {offsetTop && (
          <div className={styles.upperPlace}>
            {typeof offsetTop !== 'boolean' && offsetTop}
          </div>
        )}
        {children}
        <div ref={sentinelRef} />
      </div>

      <ScrollIndicator visible={hasMoreBelow} />

      {bottomLeft && <div className={styles.bottomLeft}>{bottomLeft}</div>}

      {bottomRight && <div className={styles.bottomRight}>{bottomRight}</div>}

      {actions && <div className={styles.actions}>{actions}</div>}

      {overlay}
    </div>
  );
};

export default memo(Screen);
