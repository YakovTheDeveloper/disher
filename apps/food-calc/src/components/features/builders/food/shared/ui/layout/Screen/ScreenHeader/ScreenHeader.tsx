import { motion, MotionValue, useTransform } from 'framer-motion';
import styles from './ScreenHeader.module.scss';
import { memo } from 'react';

type Props = {
  children: React.ReactNode;
  actions: React.ReactNode;
  scrollYProgress: MotionValue<number>;
  title?: React.ReactNode;
};

const ScreenHeader = ({ children, title, actions, scrollYProgress }: Props) => {
  const titleScale = useTransform(scrollYProgress, [0, 1], [1.5, 1]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className={styles.headerWrapper}>
      {actions}
      <motion.header className={styles.header}>
        <motion.div className={styles.title} style={{ scale: titleScale, opacity: titleOpacity }}>
          {title}
        </motion.div>
        {children}
      </motion.header>
    </div>
  );
};

export default memo(ScreenHeader);
