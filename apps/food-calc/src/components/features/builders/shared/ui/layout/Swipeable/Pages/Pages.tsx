import { observer } from 'mobx-react-lite';
import styles from './Pages.module.scss';
import { useRef, useState, useMemo, useCallback } from 'react';
import { throttle } from '@/lib/throttle';

export type ScrollDirection = 'up' | 'down' | null;

type Props = {
  children: React.ReactNode[];
  onScrollDirectionChange?: (direction: ScrollDirection) => void;
};

const Pages = ({ children, onScrollDirectionChange }: Props) => {
  const [showGradient, setShowGradient] = useState(false);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  return (
    <>
      {children.map((child, i) => (
        <div key={i} className={styles.page} style={{ flex: `0 0 ${100 / children.length}%` }}>
          {showGradient && <div className={styles.gradientOverlay} />}
          {child} <div className={styles.offset}></div>
          {/* <div ref={(el) => (pageRefs.current[i] = el)} className={styles.pageContent}>
            {child} <div className={styles.offset}></div>
          </div> */}
        </div>
      ))}
    </>
  );
};

export default observer(Pages);
