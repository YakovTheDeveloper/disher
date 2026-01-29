import { observer } from 'mobx-react-lite';
import styles from './DishFoodSelectionActions.module.scss';
import { domainStore } from '@/store/store';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
type Props = {
  children?: React.ReactNode;
};

const DishFoodSelectionActions = ({ children }: Props) => {
  const { modalStore } = domainStore.globalUiStore;
  const onCopyDishItemsToScheduleButtonClick = () => {
    modalStore.openModal(ModalType.COPY_DISH_ITEMS_TO_SCHEDULE);
  };

  const onCopyToAnotherDishButtonClick = () => {
    modalStore.openModal(ModalType.COPY_DISH_ITEMS_TO_ANOTHER_DISH);
  };

  return (
    <>
      <button onClick={onCopyDishItemsToScheduleButtonClick}>перенести еду в день</button>
      <button onClick={onCopyToAnotherDishButtonClick}>перенести еду в другое блюдо</button>
    </>
  );
};

export default observer(DishFoodSelectionActions);
