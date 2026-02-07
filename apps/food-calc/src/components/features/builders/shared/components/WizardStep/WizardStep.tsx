import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import styles from './WizardStep.module.scss';
import MagicIcon from '@/assets/icons/misc/magic-trick.svg';
import { emitter } from '@/infrastructure/emitter/emitter';

type Props = {
  children: ReactNode;
  stepKey: string | number;
  direction: number; // 1 for forward, -1 for backward
  helpButton?: boolean;
};

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

const WizardStep = ({ children, stepKey, direction, helpButton }: Props) => {
  return (
    <div className={styles.wizardWrapper}>
      {helpButton && (
        <button
          key={stepKey}
          type="button"
          className={styles.helpFocusButton}
          onClick={() => emitter.emit('WIZARD_FOCUS')}
          aria-label="Найти поле ввода"
        >
          <MagicIcon />
        </button>
      )}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          className={styles.animatedContainer}
          key={stepKey}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.05 },
          }}
        >
          {children}

          {/* Кнопка отображается только если helpButton={true} и нет активного фокуса */}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default WizardStep;
