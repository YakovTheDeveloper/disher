import { observer } from 'mobx-react-lite';
import { Instance } from 'mobx-state-tree';
import { EventItem } from '@/domain/schedule/scheduleEvent/scheduleEvent';

import { useModalsAndDrawers } from '@/components/features/shared/hooks/useModalsAndDrawers';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { getEventDescription } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/ScheduleEventItem/methods';
type Props = {
  children?: React.ReactNode;
  onClick: (id: number | string) => void;
  item: Instance<typeof EventItem>;
};

const ScheduleEventItem = ({ item }: Props) => {
  const { modalStore } = useModalsAndDrawers();

  const onEventEditModalOpen = () => {
    modalStore.openModal(ModalType.SCHEDULE_EVENT_EDIT, {
      defaultTab: 'content',
      itemToEditId: item.id,
    });
  };

  return (
    <>
      {/* <p onClick={() => onContentModalOpen(item.id)}>{item.data.variant}</p> */}
      <p onClick={onEventEditModalOpen}>{getEventDescription(item)}</p>
    </>
  );
};

export default observer(ScheduleEventItem);
