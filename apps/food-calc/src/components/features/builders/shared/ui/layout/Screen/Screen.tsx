import { observer } from 'mobx-react-lite';
import styles from './Screen.module.scss';
import { COLLAPSE_CONFIG } from './types';
import { ScreenScrollProvider } from './context/ScreenScrollContext';
import clsx from 'clsx';
import { useRef, memo } from 'react';
import { ScrollTopButton } from '@/components/features/builders/shared/ui/Actions/button/ScrollTopButton';
import { useScrollHide } from '@/hooks/useScrollHide';
import { useBottomPanelsVisibility } from './useBottomPanelsVisibility';

type Props = {
  children: React.ReactNode;
  actions?: React.ReactNode;
  bottomRight?: React.ReactNode;
  topPanel?: React.ReactNode;
  header?: React.ReactNode;
  offsetTop: boolean;
  title?: React.ReactNode;
  backgroundColor?: 'gray' | 'white';
  overlay?: React.ReactNode;
  topLeft?: React.ReactNode;
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
  offsetTop,
  overlay,
  topLeft,
  backgroundImage,
  backgroundImageOpacity = 0.05,
}: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress, isScrollingDown, isScrolledPastThreshold } = useScrollHide({
    containerRef: scrollContainerRef,
    collapseDistance: COLLAPSE_CONFIG.collapseDistance,
  });

  const { isBottomPanelsVisible } = useBottomPanelsVisibility({ isScrollingDown });

  const scrollTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={clsx([styles.screen, backgroundColor && styles[`bg-${backgroundColor}`]])}>
      {backgroundImage && (
        <img
          src={backgroundImage}
          className={styles.backgroundImage}
          style={{ opacity: backgroundImageOpacity }}
          alt=""
        />
      )}
      {topPanel && <div className={styles.topPanel}>{topPanel}</div>}
      <div className={styles.screenScroll} ref={scrollContainerRef}>
        {offsetTop && <div className={styles.upperPlace}></div>}

        {header && <ScreenScrollProvider value={scrollYProgress}>{header}</ScreenScrollProvider>}

        {children}
      </div>

      {/* ScrollTopButton with CSS-based visibility to avoid DOM thrashing */}
      <div
        className={clsx(
          styles.bottomLeft,
          isScrolledPastThreshold ? styles.visible : styles.hidden
        )}
        style={{ pointerEvents: isScrolledPastThreshold ? 'auto' : 'none' }}
      >
        <ScrollTopButton onClick={scrollTop} />
      </div>

      {bottomRight && <div className={clsx(styles.bottomRight)}>{bottomRight}</div>}

      {topLeft && (
        <div className={clsx(styles.topLeft, topLeft ? styles.visible : styles.hidden)}>
          {topLeft}
        </div>
      )}

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

export default memo(observer(Screen));
