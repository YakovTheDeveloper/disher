import { observer } from 'mobx-react-lite';
import styles from './Item.module.scss';
import { DayScheduleItemUI } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { Time } from '@/components/blocks/builders/food/ScheduleBuilder/ui/List/Time';
import { BuilderUIStore } from '@/components/blocks/builders/food/shared/BuilderUIStore';
import { FoodName } from '@/components/blocks/builders/food/shared/ui/FoodName';
import { ItemActions } from '@/components/blocks/builders/food/ScheduleBuilder/types';
import { Quantity } from '@/components/blocks/builders/food/shared/ui/Quantity';
import { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { CommonListItem } from '@/components/blocks/builders/food/shared/ui/CommonListItem';

type Props = {
  content: DayScheduleItemUI;
  options: BuilderUIStore;
  itemActions: ItemActions;
  className?: string;
};

const Item = ({ itemActions, content, options, className }: Props) => {
  console.log('LIST_ITEM', content);

  const {
    onDelete,
    onFoodsOpenInfo,
    onFoodsOpenUpdate,
    onQuantityOpen,
    onRecover,
    onTimeOpen,
    onDishOpenInfo,
  } = itemActions;

  const id = content.id;

  const getFoodName = useCallback(
    () => content.food?.name ?? content.dish?.name ?? content.customFoodName,
    [content]
  );
  const getTime = useCallback(() => content.time || '00:00', [content]);
  const getQuantity = useCallback(() => content.quantity, [content]);

  const status = content.status;

  const showAdditionalsMode = options.showAdditionals;

  const isQuantityHide = useMemo(() => showAdditionalsMode, [showAdditionalsMode]);

  // content.dish

  const onNameClick = () => {
    onFoodsOpenUpdate(id);
    return;
  };

  const onNameAdditionalOptionsClick = () => {
    if (content.dish) {
      onDishOpenInfo(id);
      return;
    }
    onFoodsOpenInfo(id);
    return;
  };

  return (
    <CommonListItem
      className={clsx([className, styles.group])}
      onDelete={onDelete}
      onRecover={onRecover}
      showAdditionals={showAdditionalsMode}
      id={id}
      status={status}
    >
      <Time onClick={onTimeOpen} id={id}>
        {getTime}
      </Time>
      <FoodName
        id={id}
        hintMode={showAdditionalsMode}
        onClick={onNameClick}
        onClickHintModeOn={onNameAdditionalOptionsClick}
      >
        {getFoodName}
      </FoodName>
      <Quantity id={id} onClick={onQuantityOpen} hide={isQuantityHide}>
        {getQuantity}
      </Quantity>
    </CommonListItem>
  );
};

export default observer(Item);
