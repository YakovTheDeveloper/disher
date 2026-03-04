import { observer } from 'mobx-react-lite';
import { useScroll, useTransform } from 'framer-motion';
import styles from './Screen.module.scss';
import { ScreenHeader } from './ScreenHeader';
import { COLLAPSE_CONFIG } from './types';
import { ScreenScrollProvider } from './context/ScreenScrollContext';
import clsx from 'clsx';
import { useRef } from 'react';

type Props = {
  children: React.ReactNode;
  actions?: React.ReactNode;
  bottom?: React.ReactNode;
  header: React.ReactNode;
  offsetTop: boolean;
  title?: React.ReactNode;
  backgroundColor?: 'gray' | 'white';
};

const Screen = ({
  header,
  children,
  bottom,
  actions,
  title,
  backgroundColor,
  offsetTop,
}: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll({
    container: scrollContainerRef,
  });

  const scrollYProgress = useTransform(scrollY, [0, COLLAPSE_CONFIG.collapseDistance], [0, 1], {
    clamp: true,
  });

  return (
    <div className={clsx([styles.screen, backgroundColor && styles[`bg-${backgroundColor}`]])}>
      <div className={styles.screenScroll} ref={scrollContainerRef}>
        {offsetTop && <div className={styles.upperPlace}></div>}
        <ScreenHeader scrollYProgress={scrollYProgress} title={title}>
          <ScreenScrollProvider value={scrollYProgress}>{header}</ScreenScrollProvider>
        </ScreenHeader>

        {children}
      </div>

      {bottom && <div className={styles.bottom}>{bottom}</div>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
};

export default observer(Screen);
