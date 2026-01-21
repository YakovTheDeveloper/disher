import { observer } from 'mobx-react-lite';
import styles from './SchheduleEventList.module.scss';
import { SearchListItem } from '@/components/ui/atoms/SearchListItem';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { EventItem, ScheduleEventType } from '@/domain/schedule/scheduleEvent/scheduleEvent';
import SleepIcon from '@/assets/icons/schedule-event-icons/sleep.svg';
import MoodIcon from '@/assets/icons/schedule-event-icons/mood.svg';
import EnergyIcon from '@/assets/icons/schedule-event-icons/energy.svg';
import SportIcon from '@/assets/icons/schedule-event-icons/sport.svg';
import CustomIcon from '@/assets/icons/schedule-event-icons/custom.svg';
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

function getIcon(value: ScheduleEventType) {
  switch (value) {
    case 'sleep':
      return <SleepIcon />;
    case 'mood':
      return <MoodIcon />;
    case 'energy':
      return <EnergyIcon />;
    case 'activity':
      return <SportIcon />;
    case 'digestion':
      return <CustomIcon />;
    case 'note':
      return <CustomIcon />;
    case 'illness':
      return <CustomIcon />;
    default:
      return null;
  }
}

const SchheduleEventList = ({ eventItem, onFinish }: Props) => {
  return (
    <ItemsList>
      {EventTypes.map((event) => (
        <SearchListItem
          key={event.value}
          item={{ name: event.label }}
          active={eventItem.type === event.value}
          onClick={() => {
            eventItem.updateType(event.value);
            onFinish();
          }}
          onInfoClick={() => {}}
          iconElement={getIcon(event.value)}
          className=""
        >
          {event.label}
        </SearchListItem>
      ))}
    </ItemsList>
  );
};

export default observer(SchheduleEventList);
