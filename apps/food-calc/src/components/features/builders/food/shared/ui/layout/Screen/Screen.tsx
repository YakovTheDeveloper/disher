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
  bottom?: React.ReactNode;
  header?: (props: {
    scrollY: MotionValue<number>;
    scrollYProgress: MotionValue<number>;
  }) => React.ReactNode;
};

const Screen = ({ header, children, bottom }: Props) => {
  const scrollY = useMotionValue(0);

  const scrollYProgress = useTransform(scrollY, [0, COLLAPSE_CONFIG.collapseDistance], [0, 1], {
    clamp: true,
  });

  const headerScale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const headerY = useTransform(scrollYProgress, [0, 1], [0, -10]);

  return (
    <div className={styles.screen}>
      <ScreenHeader scale={headerScale} y={headerY}>
        {header?.({ scrollY, scrollYProgress })}
      </ScreenHeader>

      <ScreenScroll scrollY={scrollY}>{children}</ScreenScroll>

      {bottom && <div className={styles.bottom}>{bottom}</div>}
    </div>
  );
};

export default observer(Screen);
