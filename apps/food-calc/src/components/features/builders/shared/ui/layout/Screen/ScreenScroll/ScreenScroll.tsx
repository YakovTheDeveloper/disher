import { UIEvent, useEffect, useRef } from 'react';
import { MotionValue } from 'framer-motion';
import styles from './ScreenScroll.module.scss';
import { observer } from 'mobx-react-lite';
import { useLocation } from 'react-router';
import { ScrollStoreInstance } from '@/store/GlobalUiStore/ScrollStore/ScrollStore';
import { domainStore } from '@/store/store';

type Props = {
  children: React.ReactNode;
  scrollY: MotionValue<number>;
  scrollStore?: ScrollStoreInstance;
};

export const ScreenScroll = ({
  children,
  scrollY,
  scrollStore = domainStore.globalUiStore.scrollStore,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    scrollY.set(e.currentTarget.scrollTop);
    scrollStore.setPosition(location.key, e.currentTarget.scrollTop);
  };

  useEffect(() => {
    console.log('scrollStore.positions', scrollStore.positions);

    const container = containerRef.current;
    if (!container) return;

    const y = scrollStore.getPosition(location.key) || 0;
    container.scrollTop = y;
  }, [scrollStore]);

  return (
    <div className={styles.screenScroll} onScroll={handleScroll} ref={containerRef}>
      {children}
    </div>
  );
};
ScreenScroll.displayName = 'ScreenScroll';

export default observer(ScreenScroll);
