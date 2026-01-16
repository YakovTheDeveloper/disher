import { observer } from 'mobx-react-lite';
import styles from './DishListItem.module.scss';
import { FoodName } from '@/components/features/builders/food/shared/ui/FoodName';
import { useCallback } from 'react';
import clsx from 'clsx';
import { CommonListItem } from '@/components/features/builders/food/shared/ui/CommonListItem';
import { Instance } from 'mobx-state-tree';
import { Dish, DishItem } from '@/domain/dish/Dish';
import { useDishModals } from '@/components/features/builders/food/DishBuilder/modalContext';
import { Modals } from '@/components/features/builders/food/DishBuilder/DishBuilder';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import {
  DishDrawers,
  DishModals,
  DrawerStoreInstance,
} from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import { domainStore } from '@/store/store';

type Props = {
  content: Instance<typeof DishItem>;
  controller: Instance<typeof Dish>;
  className?: string;
  drawerStore?: DrawerStoreInstance;
};

const DishListItem = ({
  controller,
  content,
  className,
  drawerStore = domainStore.globalUiStore.drawerStore,
}: Props) => {
  const modals = useDishModals();

  const onFoodsOpenUpdate = () => {
    drawerStore.open({
      type: DishDrawers.FoodEdit,
      payload: {
        defaultTab: 'content',
        itemToEditId: content.id,
      },
    });
  };

  const onQuantityOpen = () => {
    drawerStore.open({
      type: DishDrawers.FoodEdit,
      payload: {
        defaultTab: 'quantity',
        itemToEditId: content.id,
      },
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
