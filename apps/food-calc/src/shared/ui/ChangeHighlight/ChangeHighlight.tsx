import { useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import styles from './ChangeHighlight.module.scss';

type Variant = 'ripple' | 'sweep' | 'slide';

type Props = {
  trigger: unknown;
  children: React.ReactNode;
  as?: 'span' | 'div' | 'label' | 'p';
  htmlFor?: string;
  className?: string;
  contentClassName?: string;
  onClick?: React.MouseEventHandler;
  variant?: Variant | Variant[];
};

const slideTransition = { duration: 0.26, ease: [0.4, 0, 0.2, 1] as const };

export const ChangeHighlight = ({
  trigger,
  children,
  as: Tag = 'span',
  htmlFor,
  className,
  contentClassName,
  onClick,
  variant = 'ripple',
}: Props) => {
  const variants = Array.isArray(variant) ? variant : [variant];
  const hasRipple = variants.includes('ripple');
  const hasSweep = variants.includes('sweep');
  const hasSlide = variants.includes('slide');

  const [overlayKey, setOverlayKey] = useState(0);
  const [prevTrigger, setPrevTrigger] = useState(trigger);

  if (!Object.is(prevTrigger, trigger)) {
    setPrevTrigger(trigger);
    if (hasRipple || hasSweep) setOverlayKey((k) => k + 1);
  }

  const overlayActive = overlayKey > 0;
  const clearOverlay = () => setOverlayKey(0);
  const extra = Tag === 'label' ? { htmlFor } : {};

  return (
    <Tag
      className={clsx(
        styles.host,
        hasSweep && styles.hostSweep,
        hasSlide && styles.hostSlide,
        overlayActive && hasRipple && styles.hostAnimating,
        overlayActive && hasSweep && styles.hostSweepAnimating,
        className
      )}
      onClick={onClick}
      {...extra}
    >
      {overlayActive && hasRipple && (
        <span
          key={`ripple-${overlayKey}`}
          className={styles.ripple}
          aria-hidden="true"
          onAnimationEnd={clearOverlay}
        />
      )}
      {overlayActive && hasSweep && (
        <span
          key={`sweep-${overlayKey}`}
          className={styles.sweep}
          aria-hidden="true"
          onAnimationEnd={clearOverlay}
        />
      )}
      {hasSlide ? (
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={String(trigger)}
            className={clsx(styles.content, contentClassName)}
            initial={{ x: '60%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '60%', opacity: 0 }}
            transition={slideTransition}
          >
            {children}
          </motion.span>
        </AnimatePresence>
      ) : (
        <span className={clsx(styles.content, contentClassName)}>{children}</span>
      )}
    </Tag>
  );
};
