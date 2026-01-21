import { observer } from 'mobx-react-lite';
import { Instance } from 'mobx-state-tree';
import { EventItem } from '@/domain/schedule/scheduleEvent/scheduleEvent';
import { ScheduleDrawers } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import { useModalsAndDrawers } from '@/components/features/shared/hooks/useModalsAndDrawers';
import { getEventDescription } from '@/components/features/builders/food/ScheduleBuilder/EventsBuilder/components/EventListItem/methods';
type Props = {
  children?: React.ReactNode;
  onClick: (id: number | string) => void;
  item: Instance<typeof EventItem>;
};

const EventListItem = ({ item }: Props) => {
  const { drawerStore } = useModalsAndDrawers();

  const onEventEditModalOpen = () => {
    drawerStore.open({
      type: ScheduleDrawers.EventEdit,
      payload: {
        defaultTab: 'content',
        itemToEditId: item.id,
      },
    });
  };

  return (
    <>
      {/* <p onClick={() => onContentModalOpen(item.id)}>{item.data.variant}</p> */}
      <p onClick={onEventEditModalOpen}>{getEventDescription(item)}</p>
    </>
  );
};

export default observer(EventListItem);
