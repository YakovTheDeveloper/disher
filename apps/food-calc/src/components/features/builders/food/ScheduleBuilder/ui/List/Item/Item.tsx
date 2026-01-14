import { observer } from 'mobx-react-lite';
import styles from './Item.module.scss';
import { BuilderUIStore } from '@/components/features/builders/food/shared/BuilderUIStore';
import { FoodName } from '@/components/features/builders/food/shared/ui/FoodName';
import { Quantity } from '@/components/features/builders/food/shared/ui/Quantity';
import { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { CommonListItem } from '@/components/features/builders/food/shared/ui/CommonListItem';
import { Instance } from 'mobx-state-tree';
import { DaySchedule, ScheduleItem } from '@/domain/schedule/schedule';
import { useNavigate } from 'react-router';
import { RouterLinks } from '@/router';
import { domainStore } from '@/store/store';
import { ScheduleDrawers } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';

type Props = {
  controller: Instance<typeof DaySchedule>;
  item: Instance<typeof ScheduleItem>;
  options: BuilderUIStore;
  className?: string;
};

const Item = ({ item, controller, options, className }: Props) => {
  const modals = domainStore.globalUiStore.drawerStore;
  const id = item.id;

  const navigate = useNavigate();

  const onFoodsOpenUpdate = () => {
    modals.open({
      type: ScheduleDrawers.FoodEdit,
      payload: {
        defaultTab: 'foodChange',
        itemToEditId: id,
      },
    });
  };

  const onQuantityOpen = () => {
    modals.open({
      type: ScheduleDrawers.FoodEdit,
      payload: {
        defaultTab: 'quantity',
        itemToEditId: id,
      },
    });
  };

  const onFoodsOpenInfo = () => {
    modals.set('foodNutrients', { id: item.content.foodId });
  };

  const onDelete = () => controller.foods.removeChild(item.id);
  const onDishOpenInfo = () => {
    navigate(`${RouterLinks.DishBuilder}/${item.content.dishId}`);
  };

  const getFoodName = useCallback(() => item.content?.name, [item]);
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

  const getVariantText = () => {
    if (item.content.variant === 'custom') return 'кастомный продукт';
    if (item.content.variant === 'dish') return 'блюдо';
    return 'продукт';
    // if (item.food) return 'продукт';
  };

  const getFoodNameClassName = () => {
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
