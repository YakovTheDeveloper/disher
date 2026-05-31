import styles from './TimeGroup.module.scss';

import { memo } from 'react';
import clsx from 'clsx';
import { motion } from 'motion/react';
import { TimeGroupUI } from '@/shared/lib/schedule';

type Props<T> = {
  children: React.ReactNode;
  group: TimeGroupUI<T>;
  renderAside?: (group: TimeGroupUI<T>) => JSX.Element | null;
};

const TimeGroup = <T,>({ children, group, renderAside }: Props<T>) => {
  const timeOffsetFromPreviousGroupView = formatOffset(group.offset);
  const timeView =
    group.startTime === group.endTime
      ? group.startTime
      : `${group.startTime}-${group.endTime}`;

  return (
    <motion.ul
      className={styles.container}
    >
      <header className={styles.header}>
        <div className={styles.headerCenter}>
          <span className={clsx([styles.message_time, styles.message])}>
            {timeView}
          </span>
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
