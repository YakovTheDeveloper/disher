import { ModalConfirmDeleteDishes } from '@/components/features/builders/food/Dishes/modal/ModalConfirmDeleteDishes';
import { ModalCopyScheduleItemsToAnotherDay } from '@/components/features/builders/food/ScheduleBuilder/components/modal/ModalCopyScheduleItemsToAnotherDay';
import { ModalCreateDishFromSchedule } from '@/components/features/builders/food/ScheduleBuilder/components/modal/ModalCreateDishFromSchedule';
import { ModalCreateDish } from '@/components/features/builders/food/shared/modal/ModalCreateDish';
import { ModalCreateFood } from '@/components/features/builders/food/shared/modal/ModalCreateFood';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { domainStore } from '@/store/store';
import { observer } from 'mobx-react-lite';

type Props = {
  modalStore?: ModalStoreInstance;
};

export const ModalManager = observer(
  ({ modalStore = domainStore.globalUiStore.modalStore }: Props) => {
    if (!modalStore.currentModal) return null;

    switch (modalStore.currentModal) {
      case ModalType.CONFIRMATION_REMOVE_DISHES:
        return <ModalConfirmDeleteDishes />;

      case ModalType.CREATE_DISH_FROM_SCHEDULE:
        return <ModalCreateDishFromSchedule modalStore={modalStore} />;

      case ModalType.COPY_SCHEDULE_ITEMS_TO_ANOTHER_DAY:
        return <ModalCopyScheduleItemsToAnotherDay modalStore={modalStore} />;

      case ModalType.CREATE_FOOD:
        return <ModalCreateFood modalStore={modalStore} />;

      case ModalType.CREATE_DISH:
        return <ModalCreateDish modalStore={modalStore} />;

      default:
        return null;
    }
  }
);
