import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  stepKey: string | number;
  direction: number; // 1 for forward, -1 for backward
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

export const WizardStep = ({ children, stepKey, direction }: Props) => {
  return (
    <AnimatePresence initial={false} custom={direction} mode="popLayout">
      <motion.div
        key={stepKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: 'spring', stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
