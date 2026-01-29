import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import { MotionValue, useMotionValue, useTransform } from 'framer-motion';
import styles from './Screen.module.scss';
import { ScreenScroll } from './ScreenScroll';
import { ScreenHeader } from './ScreenHeader';
import { COLLAPSE_CONFIG } from './types';
import { ScreenScrollProvider } from './context/ScreenScrollContext';
import clsx from 'clsx';

type Props = {
  // header: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  bottom?: React.ReactNode;
  header: React.ReactNode;
  // header?: (scrollYProgress: MotionValue<number>) => React.ReactNode;
  title?: React.ReactNode;
  backgroundColor?: 'gray' | 'white';
  // HeaderComponent?: React.ComponentType<{ scrollYProgress: MotionValue<number> }>;
};

const Screen = ({ header, children, bottom, actions, title, backgroundColor }: Props) => {
  const scrollY = useMotionValue(0);

  const scrollYProgress = useTransform(scrollY, [0, COLLAPSE_CONFIG.collapseDistance], [0, 1], {
    clamp: true,
  });

  return (
    <div className={clsx([styles.screen, backgroundColor && styles[`bg-${backgroundColor}`]])}>
      <ScreenHeader actions={actions} scrollYProgress={scrollYProgress} title={title}>
        <ScreenScrollProvider value={scrollYProgress}>
          {header}
          {/* {header?.(scrollYProgress)} */}
        </ScreenScrollProvider>
      </ScreenHeader>

      <ScreenScroll scrollY={scrollY}>{children}</ScreenScroll>

      {bottom && <div className={styles.bottom}>{bottom}</div>}
    </div>
  );
};

export default observer(Screen);
