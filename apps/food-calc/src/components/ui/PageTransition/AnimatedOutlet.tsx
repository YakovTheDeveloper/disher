import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useOutlet, useLocation } from 'react-router-dom';
import { useNavigationDirection } from '@/hooks/useNavigationDirection';
import s from './PageTransition.module.scss';

const pageVariants: Record<string, Variants> = {
  forward: {
    initial: { x: '100%', opacity: 1 },
    animate: { x: 0, opacity: 1 },
    exit: { scale: 0.95, opacity: 0.75 },
  },
  back: {
    initial: { scale: 0.95, opacity: 0.75 },
    animate: { scale: 1, opacity: 1 },
    exit: { x: '100%', opacity: 1 },
  },
};

const transition = {
  duration: 0.35,
  ease: [0.32, 0.72, 0, 1],
};

export const AnimatedOutlet = () => {
  const element = useOutlet();
  const location = useLocation();
  const direction = useNavigationDirection();
  const variants = pageVariants[direction];

  return (
    <div className={s.container}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          className={s.page}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          transition={transition}
        >
          {element}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
