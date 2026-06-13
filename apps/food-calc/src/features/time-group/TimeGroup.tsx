import styles from './TimeGroup.module.scss';

import { memo } from 'react';
import clsx from 'clsx';
import { motion } from 'motion/react';
import { TimeGroupUI } from '@/shared/lib/schedule';
import { useItemTimesStore } from '@/shared/model/itemTimesStore';
import { formatClockRange } from '@/shared/lib/time/formatClock';
import { getTimeOfDay } from '@/shared/lib/time-of-day';

type Props<T> = {
  children: React.ReactNode;
  group: TimeGroupUI<T>;
  renderAside?: (group: TimeGroupUI<T>) => JSX.Element | null;
};

const TimeGroup = <T,>({ children, group, renderAside }: Props<T>) => {
  // Display only: strip the hour's leading zero ("00:04" → "0:04"). The grouping
  // / edit paths keep the raw "HH:mm" — this never leaves the header label.
  const timeView = formatClockRange(group.startTime, group.endTime);
  // Lets a header design-variant tint toward the group's time of day (the rows
  // already deepen morning→night; see `timeHeader.ts` + TimeGroup.module.scss).
  const tod = getTimeOfDay(group.startTime);

  // Clicking the group time toggles the global "hide per-item time" preference
  // (both Food + Event rows). The header already carries the time range, so the
  // per-row time is redundant once active. The `::after` bar under the time is
  // the clickable affordance.
  const itemTimesHidden = useItemTimesStore((s) => s.hidden);
  const toggleItemTimes = useItemTimesStore((s) => s.toggle);

  return (
    <motion.ul className={styles.container}>
      <header className={styles.header} data-tg-tod={tod}>
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
          {/* Inter-group offset label ("2 ч. 14 м.") intentionally disabled —
              re-add a formatOffset(group.offset) helper here if revived. */}
        </div>
        {renderAside && <span className={clsx([styles.headerAside])}>{renderAside?.(group)}</span>}
      </header>
      {children}
    </motion.ul>
  );
};

export default memo(TimeGroup) as typeof TimeGroup;
