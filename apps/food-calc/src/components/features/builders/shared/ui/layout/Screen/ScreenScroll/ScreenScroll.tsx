import { UIEvent, useEffect, useRef, useCallback } from 'react';
import { MotionValue } from 'framer-motion';
import styles from './ScreenScroll.module.scss';
import { observer } from 'mobx-react-lite';
import { useLocation } from 'react-router';
import { domainStore } from '@/store/store';
import { throttle } from '@/lib/throttle';

type Props = {
  children: React.ReactNode;
  scrollY: MotionValue<number>;
};

export const ScreenScroll = ({ children, scrollY }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  return (
    <div className={styles.screenScroll} ref={containerRef}>
      {children}
    </div>
  );
};
ScreenScroll.displayName = 'ScreenScroll';

export default observer(ScreenScroll);
