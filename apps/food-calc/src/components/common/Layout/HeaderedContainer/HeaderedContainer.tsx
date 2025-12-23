import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './HeaderedContainer.module.scss';
import { observer } from 'mobx-react-lite';
import { throttle } from '@/utils/throttle';

interface HeaderedContainerProps {
  header: React.ReactNode;
  main: React.ReactNode;
  className?: string;
}

const HEADER_HEIGHT = 60;
const SCROLL_THRESHOLD = 10;
const THROTTLE_DELAY = 100;

const HeaderedContainer: React.FC<HeaderedContainerProps> = ({ header, main, className }) => {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mainRef.current) return;

    const handleScroll = throttle(() => {
      const scrollY = mainRef.current!.scrollTop;
      const diff = scrollY - lastScrollY.current;

      // Ignore small scrolls
      if (Math.abs(diff) < SCROLL_THRESHOLD) return;

      setHidden(diff > 0 && scrollY > HEADER_HEIGHT);
      lastScrollY.current = scrollY;
    }, THROTTLE_DELAY);

    const mainEl = mainRef.current;
    mainEl.addEventListener('scroll', handleScroll);

    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, []);

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      <motion.div
        className={styles.header}
        animate={{ y: hidden ? -HEADER_HEIGHT : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {header}
      </motion.div>

      <motion.div
        ref={mainRef}
        className={styles.main}
        animate={{ paddingTop: hidden ? 0 : HEADER_HEIGHT }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {main}
      </motion.div>
    </div>
  );
};

export default observer(HeaderedContainer);
