import { motion, MotionValue } from 'framer-motion';
import styles from './ScreenHeader.module.scss';
import { memo } from 'react';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';

type Props = {
  children: React.ReactNode;
  scale: MotionValue<number>;
  y: MotionValue<number>;
};

const ScreenHeader = ({ children, scale, y }: Props) => {
  return (
    <div className={styles.headerWrapper}>
      <motion.header className={styles.header} style={{ y }}>
        <motion.div className={styles.title} style={{ scale }}>
          <ScreenLabel>{'Еда'}</ScreenLabel>
        </motion.div>
        {children}
      </motion.header>
    </div>
  );
};

export default memo(ScreenHeader);
