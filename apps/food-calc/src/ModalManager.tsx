import { ModalCopyScheduleItemsToAnotherDay } from '@/components/features/builders/food/ScheduleBuilder/components/modal/ModalCopyScheduleItemsToAnotherDay';
import { ModalCreateDishFromSchedule } from '@/components/features/builders/food/ScheduleBuilder/components/modal/ModalCreateDishFromSchedule';
import { ModalConfirmation } from '@/components/ui/Modal/ModalConfirmation';
import { modalComponentMap } from '@/modalConfing';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { domainStore } from '@/store/store';

type Props = {
  modalStore?: ModalStoreInstance;
};

export const ModalManager = ({ modalStore = domainStore.globalUiStore.modalStore }: Props) => {
  const activeModal = modalStore.activeModal;
  if (!activeModal) return null;

  switch (activeModal.type) {
    case ModalType.CONFIRMATION:
      return <ModalConfirmation modalStore={modalStore} data={activeModal.data} />;

    case ModalType.CREATE_DISH_FROM_SCHEDULE:
      return <ModalCreateDishFromSchedule modalStore={modalStore} data={activeModal.data} />;

    case ModalType.COPY_SCHEDULE_ITEMS_TO_ANOTHER_DAY:
      return <ModalCopyScheduleItemsToAnotherDay modalStore={modalStore} data={activeModal.data} />;

    default:
      return null;
  }
};
