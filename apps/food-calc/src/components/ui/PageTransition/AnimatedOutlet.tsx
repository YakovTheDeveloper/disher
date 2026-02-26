import { motion, AnimatePresence } from 'framer-motion';
import { useOutlet } from 'react-router-dom';
import { usePageTransitionConfig } from '@/hooks/usePageTransitionConfig';
import s from './PageTransition.module.scss';

export const AnimatedOutlet = () => {
  const element = useOutlet();
  const { variants, duration, ease, direction, locationKey, reducedMotion } =
    usePageTransitionConfig();

  const transition = {
    duration,
    ease: ease as [number, number, number, number],
  };

  const motionProps = reducedMotion
    ? { transition }
    : { transition, variants: variants[direction] };

  return (
    <div className={s.container}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={locationKey}
          className={s.page}
          initial="initial"
          animate="animate"
          exit="exit"
          {...motionProps}
        >
          {element}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
