import { observer } from 'mobx-react-lite';
import styles from './TimeGroup.module.scss';
import {
  DayScheduleItemUI,
  TimeGroupUI,
} from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';

type Props<T> = {
  children: (item: T) => JSX.Element;
  group: TimeGroupUI<T>;
  renderAside?: (group: TimeGroupUI<T>) => JSX.Element | null;
};

const TimeGroup = <T,>({ children, group, renderAside }: Props<T>) => {
  console.log('TIME_GROUP');

  const timeOffsetFromPreviousGroupView = formatOffset(group.offset);

  return (
    <ul className={styles.container}>
      <header className={styles.header}>
        <span className={styles.message} hidden={!group.offset}>
          {timeOffsetFromPreviousGroupView}
        </span>
        {renderAside?.(group)}
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
    parts.push(`${offset.minutes} мин.`);
  }

  return parts.join(' ').trim();
}
