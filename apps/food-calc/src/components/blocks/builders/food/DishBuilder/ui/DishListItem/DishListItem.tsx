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

type Props = {
  content: DishItemUI;
  options: BuilderUIStore;
  itemActions: ItemActions;
  className?: string;
};

const DishListItem = ({ itemActions, content, options, className }: Props) => {
  console.log('LIST_ITEM', content);

  const { onDelete, onFoodsOpenInfo, onFoodsOpenUpdate, onQuantityOpen, onRecover } = itemActions;

  const id = content.id;

  const getFoodName = useCallback(() => content.food?.name, [content]);
  const getQuantity = useCallback(() => content.quantity, [content]);

  const status = content.status;

  const showAdditionalsMode = options.showAdditionals;

  const isQuantityHide = useMemo(() => showAdditionalsMode, [showAdditionalsMode]);

  return (
    <CommonListItem
      className={clsx([className, styles.group])}
      onDelete={onDelete}
      onRecover={onRecover}
      showAdditionals={showAdditionalsMode}
      id={id}
      status={status}
    >
      <FoodName
        id={id}
        hintMode={showAdditionalsMode}
        onClick={onFoodsOpenUpdate}
        onClickHintModeOn={onFoodsOpenInfo}
      >
        {getFoodName}
      </FoodName>
      <Quantity id={id} onClick={onQuantityOpen} hide={isQuantityHide}>
        {getQuantity}
      </Quantity>
    </CommonListItem>
  );
};

export default observer(DishListItem);
