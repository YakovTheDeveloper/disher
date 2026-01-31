import { observer } from 'mobx-react-lite';
import styles from './TimeGroup.module.scss';

import clsx from 'clsx';
import { motion } from 'framer-motion';
import { TimeGroupUI } from '@/domain/schedule/schedule.service';

type Props<T> = {
  children: (item: T) => JSX.Element;
  group: TimeGroupUI<T>;
  renderAside?: (group: TimeGroupUI<T>) => JSX.Element | null;
  onTimeClick?: (group: TimeGroupUI<T>) => void;
};

const TimeGroup = <T,>({ children, group, renderAside, onTimeClick }: Props<T>) => {
  console.log('TIME_GROUP');

  const timeOffsetFromPreviousGroupView = formatOffset(group.offset);

  return (
    <ul className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerCenter}>
          <motion.button
            className={clsx([styles.message_time, styles.message])}
            onClick={() => onTimeClick?.(group)}
            whileTap={{ scale: 0.7 }}
            whileHover={{ scale: 1.2 }}
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
      {group.items.map(children)}
    </ul>
  );
};

export default observer(TimeGroup);

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
