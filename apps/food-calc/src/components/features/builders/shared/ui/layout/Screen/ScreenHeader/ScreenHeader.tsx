import { motion, MotionValue, useMotionValueEvent, useTransform } from 'framer-motion';
import styles from './ScreenHeader.module.scss';
import { memo, useState } from 'react';

type Props = {
  children: React.ReactNode;
  scrollYProgress: MotionValue<number>;
  title?: React.ReactNode;
};

const ScreenHeader = ({ children, title, scrollYProgress }: Props) => {
  // const discrete = useTransform(scrollYProgress, (v) => {
  //   const rounded = Math.round(v * 10) / 10;
  //   const value = rounded.toFixed(2);
  //   console.log(value);
  //   return Number(value);
  // });

  const titleOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <header className={styles.header}>
      <motion.div className={styles.title} style={{ opacity: titleOpacity }}>
        {title}
      </motion.div>
      {children}
    </header>
  );
};

export default memo(ScreenHeader);
