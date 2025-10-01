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
import { toJS } from 'mobx';

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
    [content, content.food, content.dish, content.customFoodName]
  );
  console.log('content', content);
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

  console.log('contentcontent', toJS(content));

  const getVariantText = () => {
    if (content.customFoodName) return 'кастомный продукт';
    if (content.dish) return 'блюдо';
    return 'продукт';
    // if (content.food) return 'продукт';
  };
  const getFoodNameClassName = () => {
    if (content.customFoodName) return styles.customFoodName;
    if (content.dish) return styles.dishName;
    if (content.food) return styles.foodName;
    return '';
  };

  const afterName = useMemo(() => {
    if (showAdditionalsMode) {
      return <p className={styles.variant}>{getVariantText()}</p>;
    }
    return null;
  }, [showAdditionalsMode, content]);

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
        className={getFoodNameClassName()}
        after={afterName}
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
