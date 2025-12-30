import { observer } from 'mobx-react-lite';
import styles from './SchheduleEventList.module.scss';
import { SearchListItem } from '@/components/ui/atoms/SearchListItem';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { EventItem, ScheduleEventType } from '@/domain/schedule/scheduleEvent/scheduleEvent';
type Props = {
  eventItem: Instance<typeof EventItem>;
  onFinish: () => void;
};

const EventTypes: { value: ScheduleEventType; label: string }[] = [
  {
    value: 'illness',
    label: 'недуг',
  },
  {
    value: 'note',
    label: 'заметка',
  },
  {
    value: 'activity',
    label: 'активность',
  },
  {
    value: 'digestion',
    label: 'пищеварение',
  },
  {
    value: 'sleep',
    label: 'сон',
  },
  {
    value: 'mood',
    label: 'настроение',
  },
  {
    value: 'energy',
    label: 'энергия',
  },
];

const SchheduleEventList = ({ eventItem, onFinish }: Props) => {
  return (
    <ItemsList>
      {EventTypes.map((event) => (
        <SearchListItem
          key={event.value}
          active={eventItem.type === event.value}
          onClick={() => {
            eventItem.updateType(event.value);
            onFinish();
          }}
        >
          {event.label}
        </SearchListItem>
      ))}
    </ItemsList>
  );
};

export default observer(SchheduleEventList);
