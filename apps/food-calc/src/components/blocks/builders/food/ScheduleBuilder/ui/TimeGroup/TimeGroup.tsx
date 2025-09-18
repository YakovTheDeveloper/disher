import { observer } from 'mobx-react-lite';
import styles from './TimeGroup.module.scss';
import {
  DayScheduleItemUI,
  TimeGroupUI,
} from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import clsx from 'clsx';
import { BuilderUIStore } from '@/components/blocks/builders/food/shared/BuilderUIStore';
type Props = {
  children: (item: DayScheduleItemUI) => JSX.Element;
  group: TimeGroupUI;
  onUnite: (group: TimeGroupUI) => void;
  options: BuilderUIStore;
};

const TimeGroup = ({ children, group, onUnite }: Props) => {
  console.log('TIME_GROUP');
  const onUniteHandler = () => onUnite(group);

  const timeOffsetFromPreviousGroupView = formatOffset(group.offset);

  const showUniteButton = group.items.length > 1;

  return (
    <ul className={styles.container}>
      <header className={styles.header}>
        <span className={styles.message} hidden={!group.offset}>
          {timeOffsetFromPreviousGroupView}
        </span>
        {showUniteButton && (
          <span onClick={onUniteHandler} className={clsx([styles.uniteButton])}>
            обьединить
          </span>
        )}
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
