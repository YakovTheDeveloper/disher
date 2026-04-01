import styles from './Screen.module.scss';
import clsx from 'clsx';
import { useRef, memo } from 'react';
import { useScrollHide } from '@/hooks/useScrollHide';
import { useBottomPanelsVisibility } from './useBottomPanelsVisibility';
import { useScrollBottomIndicator } from '@/hooks/useScrollBottomIndicator';
import { ScrollIndicator } from '@/shared/ui/ScrollIndicator';

type Props = {
  children: React.ReactNode;
  actions?: React.ReactNode;
  bottomRight?: React.ReactNode;
  topPanel?: React.ReactNode;
  header?: React.ReactNode;
  offsetTop?: boolean;
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
  const COLLAPSE_DISTANCE = window.innerHeight;

  const { isScrollingDown, isScrolledPastThreshold } = useScrollHide({
    containerRef: scrollContainerRef,
    collapseDistance: COLLAPSE_DISTANCE,
  });

  const { isBottomPanelsVisible: _isBottomPanelsVisible } = useBottomPanelsVisibility({
    isScrollingDown,
  });
  const { sentinelRef, hasMoreBelow } = useScrollBottomIndicator(scrollContainerRef);

  const scrollTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
        {offsetTop && <div className={styles.upperPlace}></div>}
        {children}
        <div ref={sentinelRef} />
      </div>

      <ScrollIndicator visible={hasMoreBelow} />

      {/* ScrollTopButton with CSS-based visibility to avoid DOM thrashing */}
      <div
        className={clsx(
          styles.bottomLeft,
          isScrolledPastThreshold ? styles.visible : styles.hidden
        )}
        style={{ pointerEvents: isScrolledPastThreshold ? 'auto' : 'none' }}
      >
        <button
          className={styles.scrollTopBtn}
          onClick={scrollTop}
          type="button"
          aria-label="Наверх"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 19V5M5 12l7-7 7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {bottomRight && <div className={clsx(styles.bottomRight)}>{bottomRight}</div>}

      {actions && (
        <div
          className={clsx(styles.actions)}
          // className={clsx(styles.actions, isBottomPanelsVisible ? styles.visible : styles.hidden)}
          // style={{ pointerEvents: isBottomPanelsVisible ? 'auto' : 'none' }}
        >
          {actions}
        </div>
      )}

      {overlay}
    </div>
  );
};

export default memo(Screen);
