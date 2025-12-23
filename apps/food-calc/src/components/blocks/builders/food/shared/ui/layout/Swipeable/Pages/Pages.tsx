import { observer } from 'mobx-react-lite';
import styles from './Pages.module.scss';
import { useRef, useState, useMemo, useCallback } from 'react';
import { throttle } from '@/utils/throttle';

export type ScrollDirection = 'up' | 'down' | null;

type Props = {
  children: React.ReactNode[];
  onScrollDirectionChange?: (direction: ScrollDirection) => void;
};

const Pages = ({ children, onScrollDirectionChange }: Props) => {
  const [showGradient, setShowGradient] = useState(false);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastScrollTop = useRef<number[]>([]);

  const handleScroll = useCallback(
    (index: number) => (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const currentScrollTop = el.scrollTop;
      const prevScrollTop = lastScrollTop.current[index] ?? 0;

      // Определяем направление скролла
      const delta = currentScrollTop - prevScrollTop;
      const threshold = 5; // минимальное изменение для определения направления

      if (Math.abs(delta) > threshold) {
        const direction: ScrollDirection = delta > 0 ? 'down' : 'up';
        onScrollDirectionChange?.(direction);
      }

      lastScrollTop.current[index] = currentScrollTop;

      // Проверка для градиента
      setShowGradient(el.scrollHeight > el.clientHeight);
    },
    [onScrollDirectionChange]
  );

  const throttledScrollHandlers = useMemo(() => {
    return children.map((_, index) => throttle(handleScroll(index), 50));
  }, [children.length, handleScroll]);

  return (
    <>
      {children.map((child, i) => (
        <div key={i} className={styles.page} style={{ flex: `0 0 ${100 / children.length}%` }}>
          {showGradient && <div className={styles.gradientOverlay} />}
          <div
            ref={(el) => (pageRefs.current[i] = el)}
            className={styles.pageContent}
            onScroll={throttledScrollHandlers[i]}
          >
            {child} <div className={styles.offset}></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default observer(Pages);
