import { observer } from 'mobx-react-lite';
import { Time } from '@/components/blocks/builders/food/ScheduleBuilder/ui/List/Time';
import { ScheduleQuestionnaireItemUI } from '@/components/blocks/builders/food/ScheduleBuilder/EventsBuilder/viewModel/EventsBuilderViewModel';
import { toJS } from 'mobx';
type Props = {
  children?: React.ReactNode;
  onTimeModalOpen: (id: number | string) => void;
  onContentModalOpen: (id: number | string) => void;
  item: ScheduleQuestionnaireItemUI;
};

const EventListItem = ({ item, onTimeModalOpen, onContentModalOpen }: Props) => {
  function getEventDescription(item: ScheduleQuestionnaireItemUI): string {
    console.log('EventListItem', toJS(item));

    const variant = item.data.variant;

    switch (variant) {
      case 'sleep':
        return `Сон: ${item.data.content.hours}ч ${item.data.content.minutes}м, качество ${item.data.content.quality}/10`;
      case 'mood':
        return `Настроение: ${item.data.content.value}/10`;
      case 'energy':
        return `Энергия: ${item.data.content.value}/10`;
      case 'digestion':
        return `Пищеварение (${item.data.content.variant}): ${item.data.content.value}/10`;
      case 'activity':
        return `Активность: ${item.data.content.variant}, ${item.data.content.hours}ч ${item.data.content.minutes}м`;
      case 'note':
        return `Заметка: ${item.data.content.value}`;
    }
  }

  return (
    <>
      <Time onClick={onTimeModalOpen} id={item.id}>
        {() => item.time}
      </Time>
      {/* <p onClick={() => onContentModalOpen(item.id)}>{item.data.variant}</p> */}
      <p onClick={() => onContentModalOpen(item.id)}>{getEventDescription(item)}</p>
    </>
  );
};

export default observer(EventListItem);
