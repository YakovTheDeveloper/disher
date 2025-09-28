import { observer } from 'mobx-react-lite';
import styles from './EventListItem.module.scss';
import { Time } from '@/components/blocks/builders/food/ScheduleBuilder/ui/List/Time';
import {
  DailyEventData,
  DailyEventVariants,
  ScheduleQuestionnaireItemUI,
} from '@/components/blocks/builders/food/ScheduleBuilder/EventsBuilder/viewModel/EventsBuilderViewModel';
type Props = {
  children?: React.ReactNode;
  onTimeModalOpen: (id: number | string) => void;
  onContentModalOpen: (id: number | string) => void;
  item: ScheduleQuestionnaireItemUI;
};

const EventListItem = ({ item, onTimeModalOpen, onContentModalOpen }: Props) => {
  function getEventDescription(event: DailyEventData): string {
    switch (event.variant) {
      case 'sleep':
        return `Сон: ${event.content.hours}ч ${event.content.minutes}м, качество ${event.content.quality}/10`;
      case 'mood':
        return `Настроение: ${event.content.value}/10`;
      case 'energy':
        return `Энергия: ${event.content.value}/10`;
      case 'digestion':
        return `Пищеварение (${event.content.variant}): ${event.content.value}/10`;
      case 'activity':
        return `Активность: ${event.content.variant}, ${event.content.hours}ч ${event.content.minutes}м`;
      case 'note':
        return `Заметка: ${event.content.value}`;
    }
  }

  return (
    <>
      <Time onClick={onTimeModalOpen} id={item.id}>
        {() => item.time}
      </Time>
      {/* <p onClick={() => onContentModalOpen(item.id)}>{item.data.variant}</p> */}
      <p onClick={() => onContentModalOpen(item.id)}>{getEventDescription(item.data)}</p>
    </>
  );
};

export default observer(EventListItem);
