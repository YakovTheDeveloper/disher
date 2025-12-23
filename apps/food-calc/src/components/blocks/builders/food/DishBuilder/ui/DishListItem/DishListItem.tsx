import { observer } from 'mobx-react-lite';
import styles from './DishListItem.module.scss';
import { BuilderUIStore } from '@/components/blocks/builders/food/shared/BuilderUIStore';
import { FoodName } from '@/components/blocks/builders/food/shared/ui/FoodName';
import { ItemActions } from '@/components/blocks/builders/food/ScheduleBuilder/types';
import { Quantity } from '@/components/blocks/builders/food/shared/ui/Quantity';
import { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { CommonListItem } from '@/components/blocks/builders/food/shared/ui/CommonListItem';
import { DishItemUI } from '@/components/blocks/builders/food/DishBuilder/model/DishBuilderViewModel';
import { Instance } from 'mobx-state-tree';
import { Dish, DishItem } from '@/domain/dish/Dish';
import { useDishModals } from '@/components/blocks/builders/food/DishBuilder/modalContext';
import { Modals } from '@/components/blocks/builders/food/DishBuilder/DishBuilder';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';

type Props = {
  content: Instance<typeof DishItem>;
  controller: Instance<typeof Dish>;
  options: BuilderUIStore;
  className?: string;
};

const DishListItem = ({ itemActions, controller, content, options, className }: Props) => {
  console.log('LIST_ITEM', content);

  const modals = useDishModals();

  const onFoodsOpenUpdate = () => {
    modals?.set(Modals.Food, {
      item_id: content.id,
    });
  };

  const onQuantityOpen = () => {
    modals?.set('quantity');
  };

  const onFoodsOpenInfo = () => {
    modals?.set('foodNutrients');
  };

  const onDelete = () => controller.removeChild(content.id);
  // const onRecover = () => content.recover();

  const id = content.id;

  const getFoodName = useCallback(() => content.food?.name, [content]);
  const getQuantity = useCallback(() => content.quantity, [content]);

  const showAdditionalsMode = options.showAdditionals;

  const isQuantityHide = useMemo(() => showAdditionalsMode, [showAdditionalsMode]);

  const onChange = (quantity: number) => controller.updateChildById({ id: content.id, quantity });

  return (
    <CommonListItem
      className={clsx([className, styles.group])}
      onDelete={onDelete}
      showAdditionals={showAdditionalsMode}
      id={id}
      sync={content.sync}
    >
      <FoodName
        id={id}
        hintMode={showAdditionalsMode}
        onClick={onFoodsOpenUpdate}
        onClickHintModeOn={onFoodsOpenInfo}
      >
        {getFoodName}
      </FoodName>
      {!isQuantityHide && (
        <NumberInput value={content.quantity} onChange={onChange} useLocalValue />
      )}
    </CommonListItem>
  );
};

export default observer(DishListItem);
