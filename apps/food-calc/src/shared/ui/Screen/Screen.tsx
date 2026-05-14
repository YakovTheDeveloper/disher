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
  bottomBar?: React.ReactNode;
  topPanel?: React.ReactNode;
  header?: React.ReactNode;
  title?: React.ReactNode;
  backgroundColor?: 'gray' | 'white';
  className?: string;
  overlay?: React.ReactNode;
  backgroundImage?: string;
  backgroundImageOpacity?: number;
  /**
   * Samokat-style: children обёрнуты в opaque-белую плашку с
   * top-radius и `margin-top: -16px`, накрывающую низ `header`'а.
   * При скролле всей панели контент «всплывает» поверх хедера —
   * хедер уходит «под» контент. Без JS.
   */
  headerOverlap?: boolean;
  /**
   * Когда `true` — visual `.headerOverlap` «лист» становится прозрачным
   * и теряет тень. Использовать для пустых экранов (нет событий → нет
   * «листа»). Триггер через `data-hollow` атрибут, чтобы стили жили в CSS.
   */
  hollow?: boolean;
  /**
   * Sticky-блок внутри `screenScroll`. Прилипает к `top: var(--top-bar-h, 0)`
   * (см. `.stickyTop` в CSS). Используется HomePage'ем чтобы класть
   * ScreenIndicator В ПОТОК каждого слайда — sticky резервирует место
   * естественно, контент идёт после без `padding-top`-компенсации,
   * клики ловятся самим элементом без invisible-overlay'ев.
   */
  stickyTop?: React.ReactNode;
};

const Screen = ({
  header,
  children,
  bottomRight,
  bottomLeft,
  bottomBar,
  topPanel,
  actions,
  backgroundColor,
  className,
  overlay,
  backgroundImage,
  backgroundImageOpacity = 0.05,
  headerOverlap = false,
  hollow = false,
  stickyTop,
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
      <div className={styles.scrollWrap}>
        <div className={styles.screenScroll} ref={scrollContainerRef}>
          {stickyTop && <div className={styles.stickyTop}>{stickyTop}</div>}
          <div className={styles.topPanel}>{topPanel}</div>
          {header}
          {headerOverlap ? (
            <div
              className={styles.headerOverlap}
              data-hollow={hollow ? 'true' : undefined}
            >
              {children}
            </div>
          ) : (
            children
          )}
          <div ref={sentinelRef} />
        </div>
        <ScrollIndicator visible={hasMoreBelow} />
      </div>

      {bottomBar && <div className={styles.bottomBar}>{bottomBar}</div>}

      {bottomLeft && <div className={styles.bottomLeft}>{bottomLeft}</div>}

      {bottomRight && <div className={styles.bottomRight}>{bottomRight}</div>}

      {actions && <div className={styles.actions}>{actions}</div>}

      {overlay}
    </div>
  );
};

export default memo(Screen);
