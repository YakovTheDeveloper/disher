import { ModalCopyScheduleItemsToAnotherDay } from '@/components/features/builders/ScheduleBuilder/components/modal/ModalCopyScheduleItemsToAnotherDay';
import { ModalCreateDishFromSchedule } from '@/components/features/builders/ScheduleBuilder/components/modal/ModalCreateDishFromSchedule';
import { ModalPhysicalActivityPulse } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/modal/ModalPhysicalActivityPulse';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { domainStore } from '@/store/store';
import { observer } from 'mobx-react-lite';
import { ScheduleModals } from '@/components/features/builders/ScheduleBuilder/components/modal/ScheduleModals';
import { DishModals } from '@/components/features/builders/DishBuilder/components/modal/DishModals';

type Props = {
  modalStore?: ModalStoreInstance;
};

export const ModalManager = observer(
  ({ modalStore = domainStore.globalUiStore.modalStore }: Props) => {
    if (!modalStore.currentModal) return null;

    switch (modalStore.currentModal) {
      case ModalType.CREATE_DISH_FROM_SCHEDULE:
        return <ModalCreateDishFromSchedule modalStore={modalStore} />;

      case ModalType.COPY_SCHEDULE_ITEMS_TO_ANOTHER_DAY:
        return <ModalCopyScheduleItemsToAnotherDay modalStore={modalStore} />;

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

      case ModalType.DISH_CREATE:
      case ModalType.DISH_EDIT:
        return (
          <DishModals
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
