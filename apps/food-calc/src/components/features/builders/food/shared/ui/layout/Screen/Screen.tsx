import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import { MotionValue, useMotionValue, useTransform } from 'framer-motion';
import styles from './Screen.module.scss';
import { ScreenScroll } from './ScreenScroll';
import { ScreenHeader } from './ScreenHeader';
import { COLLAPSE_CONFIG } from './types';

type Props = {
  // header: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  bottom?: React.ReactNode;
  header?: (scrollYProgress: MotionValue<number>) => React.ReactNode;
  title?: string;
};

const Screen = ({ header, children, bottom, actions, title }: Props) => {
  const scrollY = useMotionValue(0);

  const scrollYProgress = useTransform(scrollY, [0, COLLAPSE_CONFIG.collapseDistance], [0, 1], {
    clamp: true,
  });

  return (
    <div className={styles.screen}>
      <ScreenHeader actions={actions} scrollYProgress={scrollYProgress} title={title}>
        {header?.(scrollYProgress)}
      </ScreenHeader>

      <ScreenScroll scrollY={scrollY}>{children}</ScreenScroll>

      {bottom && <div className={styles.bottom}>{bottom}</div>}
    </div>
  );
};

export default observer(Screen);
