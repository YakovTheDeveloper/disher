import { observer } from 'mobx-react-lite';
import styles from './Item.module.scss';
import { DayScheduleItemUI } from '@/components/features/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { Time } from '@/components/features/builders/food/ScheduleBuilder/ui/List/Time';
import { BuilderUIStore } from '@/components/features/builders/food/shared/BuilderUIStore';
import { FoodName } from '@/components/features/builders/food/shared/ui/FoodName';
import { ItemActions } from '@/components/features/builders/food/ScheduleBuilder/types';
import { Quantity } from '@/components/features/builders/food/shared/ui/Quantity';
import { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { CommonListItem } from '@/components/features/builders/food/shared/ui/CommonListItem';
import { toJS } from 'mobx';
import { Instance } from 'mobx-state-tree';
import { DaySchedule, ScheduleItem } from '@/domain/schedule/schedule';
import { useDailyScheduleModals } from '@/components/features/builders/food/ScheduleBuilder/modalContext';
import { useNavigate } from 'react-router';
import { RouterLinks } from '@/router';
import { Modals } from '@/components/features/builders/food/ScheduleBuilder/ScheduleBuilderV2';

type Props = {
  controller: Instance<typeof DaySchedule>;
  item: Instance<typeof ScheduleItem>;
  options: BuilderUIStore;
  className?: string;
};

const Item = ({ item, controller, options, className }: Props) => {
  const modals = useDailyScheduleModals();

  const navigate = useNavigate();

  console.log('LIST_ITEM', item);

  const onFoodsOpenUpdate = () => {
    modals.set(Modals.FoodEdit, {
      item_id: item.id,
    });
  };

  const onQuantityOpen = () => {
    modals.set('quantity', {
      item_id: item.id,
    });
  };

  const onFoodsOpenInfo = () => {
    modals.set('foodNutrients', { id: item.content.foodId });
  };

  const onDelete = () => controller.foods.updateChildById(item.id);
  const onDishOpenInfo = () => {
    console.log('item.content', item.content);
    navigate(`${RouterLinks.DishBuilder}/${item.content.dishId}`);
  };

  const id = item.id;

  const getFoodName = useCallback(() => item.content?.name, [item]);
  console.log('item', item);
  // const getTime = useCallback(() => item.time || '00:00', [item]);
  const getQuantity = useCallback(() => item.quantity, [item]);

  const showAdditionalsMode = options.showAdditionals;

  const isQuantityHide = useMemo(() => showAdditionalsMode, [showAdditionalsMode]);

  // item.dish

  const onNameAdditionalOptionsClick = () => {
    if (item.content.variant === 'dish') {
      onDishOpenInfo();
      return;
    }
    onFoodsOpenInfo();
    return;
  };

  console.log('itemitem', toJS(item));

  const getVariantText = () => {
    if (item.content.variant === 'custom') return 'кастомный продукт';
    if (item.content.variant === 'dish') return 'блюдо';
    return 'продукт';
    // if (item.food) return 'продукт';
  };

  const getFoodNameClassName = () => {
    console.log('f', item);
    const prefix = item.type;
    return styles[`${prefix}Title`];
  };

  const afterName = useMemo(() => {
    if (showAdditionalsMode) {
      return <p className={styles.variant}>{getVariantText()}</p>;
    }
    return null;
  }, [showAdditionalsMode, item.content]);

  return (
    <CommonListItem
      className={clsx([className, styles.group])}
      onDelete={onDelete}
      showAdditionals={showAdditionalsMode}
      id={id}
      sync={item.sync}
    >
      <FoodName
        className={getFoodNameClassName()}
        id={id}
        hintMode={showAdditionalsMode}
        onClick={onFoodsOpenUpdate}
        onClickHintModeOn={onNameAdditionalOptionsClick}
      >
        {getFoodName}
      </FoodName>
      <Quantity id={id} onClick={onQuantityOpen} hide={isQuantityHide}>
        {getQuantity}
      </Quantity>
      {afterName}
    </CommonListItem>
  );
};

export default observer(Item);
