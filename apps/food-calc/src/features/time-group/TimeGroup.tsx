import styles from './TimeGroup.module.scss';

import clsx from 'clsx';
import { motion } from 'motion/react';
import { TimeGroupUI } from '@/shared/lib/schedule';

type Props<T> = {
  children: React.ReactNode;
  group: TimeGroupUI<T>;
  renderAside?: (group: TimeGroupUI<T>) => JSX.Element | null;
  onTimeClick?: (group: TimeGroupUI<T>) => void;
  isFuture?: boolean;
};

const TimeGroup = <T,>({ children, group, renderAside, onTimeClick, isFuture }: Props<T>) => {
  console.log('TIME_GROUP');

  const disabled = !onTimeClick;

  const timeOffsetFromPreviousGroupView = formatOffset(group.offset);

  return (
    <ul className={clsx(styles.container, isFuture && styles.future)}>
      <header className={styles.header}>
        <div className={styles.headerCenter}>
          <motion.button
            disabled={!onTimeClick}
            className={clsx([styles.message_time, styles.message])}
            onClick={() => onTimeClick?.(group)}
            whileTap={disabled ? undefined : { scale: 0.7 }}
            whileHover={disabled ? undefined : { scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {group.time}
          </motion.button>
          {group.offset && (
            <span className={clsx([styles.message_delta, styles.message])}>
              {timeOffsetFromPreviousGroupView}
            </span>
          )}
        </div>
        {renderAside && <span className={clsx([styles.headerAside])}>{renderAside?.(group)}</span>}
      </header>
      {children}
    </ul>
  );
};

export default TimeGroup;

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
