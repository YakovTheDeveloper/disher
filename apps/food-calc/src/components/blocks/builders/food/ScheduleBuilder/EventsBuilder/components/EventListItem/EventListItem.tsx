import { observer } from 'mobx-react-lite';
import { Time } from '@/components/blocks/builders/food/ScheduleBuilder/ui/List/Time';
import { ScheduleQuestionnaireItemUI } from '@/components/blocks/builders/food/ScheduleBuilder/EventsBuilder/viewModel/EventsBuilderViewModel';
import { toJS } from 'mobx';
import { EventItem } from '@/domain/schedule/schedule';
import { Instance } from 'mobx-state-tree';
import { useDailyScheduleModals } from '@/components/blocks/builders/food/ScheduleBuilder/modalContext';
type Props = {
  children?: React.ReactNode;
  onTimeModalOpen: (id: number | string) => void;
  item: Instance<typeof EventItem>;
};

const EventListItem = ({ item }: Props) => {
  const modals = useDailyScheduleModals();

  function getEventDescription(item: Instance<typeof EventItem>): string {
    console.log('EventListItem', toJS(item));

    const variant = item.type;

    switch (variant) {
      case 'sleep':
        return `Сон: ${item.value}, качество ${item.value}/10`;
      case 'mood':
        return `Настроение: ${item.value}/10`;
      case 'energy':
        return `Энергия: ${item.value}/10`;
      case 'digestion':
        return `Пищеварение (${item.type}): ${item.value}/10`;
      case 'activity':
        return `Активность: ${item.type}, ${item.value}`;
      case 'note':
        return `Заметка: ${item.value}`;
    }
  }

  const onTitle = () => {
    modals.set('eventContent', { id: item.id }, []);
  };

  return (
    <>
      {/* <p onClick={() => onContentModalOpen(item.id)}>{item.data.variant}</p> */}
      <p onClick={onTitle}>{getEventDescription(item)}</p>
    </>
  );
};

export default observer(EventListItem);
