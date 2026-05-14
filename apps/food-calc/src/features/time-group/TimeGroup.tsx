import styles from './TimeGroup.module.scss';

import { memo } from 'react';
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
  const disabled = !onTimeClick;
  const timeOffsetFromPreviousGroupView = formatOffset(group.offset);

  return (
    <motion.ul
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
      {children}
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
