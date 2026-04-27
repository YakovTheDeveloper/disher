import styles from './TimeGroup.module.scss';

import { memo } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { TimeGroupUI } from '@/shared/lib/schedule';

type Props<T> = {
  children: React.ReactNode;
  group: TimeGroupUI<T>;
  renderAside?: (group: TimeGroupUI<T>) => JSX.Element | null;
  onTimeClick?: (group: TimeGroupUI<T>) => void;
  isFuture?: boolean;
};

// Material `--easing-default` cubic-bezier(0.4, 0, 0.2, 1) split into asymmetric halves:
// enter uses the deceleration tail (object catches up to its place);
// exit uses the acceleration head (object slips away).
const EASE_OUT = [0, 0, 0.2, 1] as const;
const EASE_IN = [0.4, 0, 1, 1] as const;

const ENTER_TRANSITION = { duration: 0.28, ease: EASE_OUT } as const;
const EXIT_TRANSITION = { duration: 0.16, ease: EASE_IN } as const;

const TimeGroup = <T,>({ children, group, renderAside, onTimeClick, isFuture }: Props<T>) => {
  const disabled = !onTimeClick;
  const reducedMotion = useReducedMotion();
  const timeOffsetFromPreviousGroupView = formatOffset(group.offset);

  const motionProps = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0, transition: ENTER_TRANSITION },
        exit: { opacity: 0, y: -4, transition: EXIT_TRANSITION },
      };

  return (
    <motion.ul
      {...motionProps}
      className={clsx(styles.container, isFuture && styles.future)}
    >
      <header className={styles.header}>
        <div className={styles.headerCenter}>
          <button
            type="button"
            disabled={disabled}
            className={clsx([styles.message_time, styles.message])}
            onClick={() => onTimeClick?.(group)}
          >
            {group.time}
          </button>
          {group.offset && (
            <span className={clsx([styles.message_delta, styles.message])}>
              {timeOffsetFromPreviousGroupView}
            </span>
          )}
        </div>
        {renderAside && <span className={clsx([styles.headerAside])}>{renderAside?.(group)}</span>}
      </header>
      {reducedMotion ? children : <AnimatePresence initial={false}>{children}</AnimatePresence>}
    </motion.ul>
  );
};

export default memo(TimeGroup) as typeof TimeGroup;

function formatOffset(offset: { hours: number; minutes: number } | null): string {
  if (!offset) return '';

  const parts: string[] = [];

  if (offset.hours > 0) {
    parts.push(`${offset.hours} ч.`);
  }
  if (offset.minutes > 0) {
    parts.push(`${offset.minutes} м.`);
  }

  return parts.join(' ').trim();
}
