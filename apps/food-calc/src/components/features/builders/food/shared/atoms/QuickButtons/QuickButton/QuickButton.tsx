import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styles from './QuickButton.module.scss';
import { motion } from 'framer-motion';
type Props = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  isActive: boolean;
  onClick: () => void;
};

const QuickButton = ({ children, className, style, isActive, onClick }: Props) => {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    onClick();
  };

  return (
    <div className={styles.quickButtonWrapper}>
      <motion.button
        onClick={handleClick}
        className={`${styles.quickButton} ${className || ''} ${isActive && styles.activeButton} ${animating && styles.animating}`}
        style={style}
      >
        {children}
      </motion.button>
      <motion.div
        className={styles.circle}
        animate={
          animating
            ? { scale: 3, opacity: 0, translateX: '-50%', translateY: '-50%' }
            : { scale: 0, opacity: 1, translateX: '-50%', translateY: '-50%' }
        }
        transition={animating ? { duration: 0.7 } : { duration: 0 }}
        onAnimationComplete={() => setAnimating(false)}
      />
    </div>
  );
};

export default observer(QuickButton);
