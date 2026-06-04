import styles from './TimeGroup.module.scss';

import { memo } from 'react';
import clsx from 'clsx';
import { motion } from 'motion/react';
import { TimeGroupUI } from '@/shared/lib/schedule';
import { useItemTimesStore } from '@/shared/model/itemTimesStore';

type Props<T> = {
  children: React.ReactNode;
  group: TimeGroupUI<T>;
  renderAside?: (group: TimeGroupUI<T>) => JSX.Element | null;
};

const TimeGroup = <T,>({ children, group, renderAside }: Props<T>) => {
  const timeOffsetFromPreviousGroupView = formatOffset(group.offset);
  const timeView =
    group.startTime === group.endTime ? group.startTime : `${group.startTime}-${group.endTime}`;

  // Clicking the group time toggles the global "hide per-item time" preference
  // (both Food + Event rows). The header already carries the time range, so the
  // per-row time is redundant once active. The `::after` bar under the time is
  // the clickable affordance.
  const itemTimesHidden = useItemTimesStore((s) => s.hidden);
  const toggleItemTimes = useItemTimesStore((s) => s.toggle);

  return (
    <motion.ul className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerCenter}>
          <span
            className={clsx([styles.message_time, styles.message])}
            role="button"
            tabIndex={0}
            aria-pressed={itemTimesHidden}
            data-active={itemTimesHidden}
            onClick={toggleItemTimes}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleItemTimes();
              }
            }}
          >
            {timeView}
          </span>
          {/* {group.offset && (
            <span className={clsx([styles.message_delta, styles.message])}>
              {timeOffsetFromPreviousGroupView}
            </span>
          )} */}
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
