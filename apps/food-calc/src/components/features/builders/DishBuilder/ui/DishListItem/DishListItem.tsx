import { observer } from 'mobx-react-lite';
import styles from './DishListItem.module.scss';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { useCallback } from 'react';
import clsx from 'clsx';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { Instance } from 'mobx-state-tree';
import { Dish, DishItem } from '@/domain/dish/Dish.model';
import { useDishModals } from '@/components/features/builders/DishBuilder/modalContext';
import { Modals } from '@/components/features/builders/DishBuilder/DishBuilder';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';

import { domainStore } from '@/store/store';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';

type Props = {
  content: Instance<typeof DishItem>;
  controller: Instance<typeof Dish>;
  className?: string;
  modalStore?: ModalStoreInstance;
};

const DishListItem = ({
  controller,
  content,
  className,
  modalStore = domainStore.globalUiStore.modalStore,
}: Props) => {
  const onFoodsOpenUpdate = () => {
    modalStore.openModal(ModalType.DISH_EDIT, {
      defaultTab: 'content',
      itemToEditId: content.id,
    });
  };

  const onQuantityOpen = () => {
    modalStore.openModal(ModalType.DISH_EDIT, {
      defaultTab: 'quantity',
      itemToEditId: content.id,
    });
  };

  const onDelete = () => controller.removeChild(content.id);
  // const onRecover = () => content.recover();

  const id = content.id;

  const getFoodName = useCallback(() => content.food?.name, [content]);
  const getQuantity = useCallback(() => content.quantity, [content]);

  const onChange = (quantity: number) => controller.updateChildById({ id: content.id, quantity });

  return (
    <CommonListItem className={clsx([className, styles.group])} id={id} sync={content.sync}>
      <FoodName id={id} onClick={onFoodsOpenUpdate}>
        {getFoodName}
      </FoodName>
      <NumberInput value={content.quantity} onChange={onChange} />
    </CommonListItem>
  );
};

export default observer(DishListItem);
