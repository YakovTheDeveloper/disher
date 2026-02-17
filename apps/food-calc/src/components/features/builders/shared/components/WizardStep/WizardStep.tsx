import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import styles from './WizardStep.module.scss';

type Props = {
  children: ReactNode;
  stepKey: string | number;
  direction?: number;
  helpButton?: boolean;
};

const variants = {
  enter: {
    opacity: 0,
    scale: 0.95,
  },
  center: {
    zIndex: 1,
    opacity: 1,
    scale: 1,
  },
  exit: {
    zIndex: 0,
    opacity: 0,
    scale: 0.95,
  },
};

const WizardStep = ({ children, stepKey, helpButton }: Props) => {
  return (
    <div className={styles.wizardWrapper}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          className={styles.animatedContainer}
          key={stepKey}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            opacity: { duration: 0.2, ease: 'easeOut' },
            scale: { duration: 0.2, ease: 'easeOut' },
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default WizardStep;
