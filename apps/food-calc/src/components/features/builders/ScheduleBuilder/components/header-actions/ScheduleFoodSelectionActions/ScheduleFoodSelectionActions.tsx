import { observer } from 'mobx-react-lite';
import styles from './ScheduleFoodSelectionActions.module.scss';
import { domainStore } from '@/store/store';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
type Props = {
  children?: React.ReactNode;
};

const ScheduleFoodSelectionActions = ({ children }: Props) => {
  const { modalStore } = domainStore.globalUiStore;
  const onCreateDishButtonClick = () => {
    modalStore.openModal(ModalType.CREATE_DISH_FROM_SCHEDULE);
  };

  const onCopyToAnotherDayButtonClick = () => {
    modalStore.openModal(ModalType.COPY_SCHEDULE_ITEMS_TO_ANOTHER_DAY);
  };

  return (
    <>
      <button onClick={onCreateDishButtonClick}>создать новое блюдо</button>
      <button onClick={onCopyToAnotherDayButtonClick}>перенести еду в другой день</button>
    </>
  );
};

export default observer(ScheduleFoodSelectionActions);
