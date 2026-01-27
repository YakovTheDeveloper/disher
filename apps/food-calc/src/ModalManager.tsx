import { ModalConfirmDeleteDishes } from '@/components/features/lists/Dishes/modal/ModalConfirmDeleteDishes';
import { ModalCopyScheduleItemsToAnotherDay } from '@/components/features/builders/food/ScheduleBuilder/components/modal/ModalCopyScheduleItemsToAnotherDay';
import { ModalCreateDishFromSchedule } from '@/components/features/builders/food/ScheduleBuilder/components/modal/ModalCreateDishFromSchedule';
import { ModalCreateDish } from '@/components/features/builders/food/shared/modal/ModalCreateDish';
import { ModalCreateFood } from '@/components/features/builders/food/shared/modal/ModalCreateFood';
import { ModalPhysicalActivityPulse } from '@/components/features/builders/food/ScheduleBuilder/EventsBuilder/components/modal/ModalPhysicalActivityPulse';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { domainStore } from '@/store/store';
import { observer } from 'mobx-react-lite';
import { ModalConfirmationDeleteEvents } from '@/components/features/builders/food/ScheduleBuilder/components/modal/ModalConfirmationDeleteEvents';
import ScheduleProvider from '@/components/features/builders/food/ScheduleBuilder/context/ScheduleProvider';
import { ScheduleModals } from '@/components/features/builders/food/ScheduleBuilder/components/modal/ScheduleModals';

type Props = {
  modalStore?: ModalStoreInstance;
};

export const ModalManager = observer(
  ({ modalStore = domainStore.globalUiStore.modalStore }: Props) => {
    if (!modalStore.currentModal) return null;

    const drawerStore = domainStore.globalUiStore.drawerStore;

    switch (modalStore.currentModal) {
      case ModalType.CONFIRMATION_REMOVE_DISHES:
        return <ModalConfirmDeleteDishes />;

      case ModalType.CONFIRMATION_REMOVE_SCHEDULE_EVENTS:
        return (
          <ScheduleProvider>
            <ModalConfirmationDeleteEvents />
          </ScheduleProvider>
        );

      case ModalType.CREATE_DISH_FROM_SCHEDULE:
        return <ModalCreateDishFromSchedule modalStore={modalStore} />;

      case ModalType.COPY_SCHEDULE_ITEMS_TO_ANOTHER_DAY:
        return <ModalCopyScheduleItemsToAnotherDay modalStore={modalStore} />;

      case ModalType.CREATE_FOOD:
        return <ModalCreateFood modalStore={modalStore} drawerStore={drawerStore} />;

      case ModalType.CREATE_DISH:
        return <ModalCreateDish modalStore={modalStore} />;

      case ModalType.PULSE_PHYSICAL_ACTIVITY:
        return <ModalPhysicalActivityPulse>{null}</ModalPhysicalActivityPulse>;

      case ModalType.SCHEDULE_FOOD_ADD:
      case ModalType.SCHEDULE_FOOD_EDIT:
      case ModalType.SCHEDULE_EVENT_ADD:
      case ModalType.SCHEDULE_EVENT_EDIT:
        return (
          <ScheduleModals
            type={modalStore.currentModal}
            payload={modalStore.payload}
            close={() => modalStore.closeModal()}
          />
        );

      default:
        return null;
    }
  }
);
