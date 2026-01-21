import { forwardRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react-lite';
import styles from './Swipeable.module.scss';
import { useSwipeable } from './useSwipeable';

type Props = {
  pageNames?: string[];
  defaultIndex?: number;
  onIndexChange?: (index: number, total: number) => void;
  enableHashSync?: boolean;
  children: React.ReactNode[];
  style?: React.CSSProperties;
};

export type SwipeableRef = {
  goToPage: (index: number) => void;
};

const Swipeable = forwardRef<SwipeableRef, Props>(
  (
    { pageNames, defaultIndex = 0, onIndexChange, enableHashSync = false, children, style },
    ref
  ) => {
    const total = children.length;

    if (pageNames && pageNames.length !== total) {
      throw new Error('pageNames length must match the number of children');
    }

    const { emblaRef, selectedIndex, goToPage, slidesInView } = useSwipeable({
      pageNames,
      defaultIndex,
      onIndexChange,
      enableHashSync,
      total,
    });

    useImperativeHandle(ref, () => ({
      goToPage,
    }));

    return (
      <div className={styles.viewport} ref={emblaRef} style={style}>
        <div className={styles.container}>
          {children.map((child, i) => (
            <div
              // data-embla-no-drag
              key={i}
              className={`${styles.slide}`}
            >
              {child}
            </div>
          ))}
        </div>

        {total > 1 && (
          <div className={styles.dots}>
            {children.map((_, i) => (
              <span
                key={i}
                className={`${styles.dot} ${i === selectedIndex ? styles.active : ''}`}
              ></span>
            ))}
          </div>
        )}
      </div>
    );
  }
);

Swipeable.displayName = 'Swipeable';

export default observer(Swipeable);
