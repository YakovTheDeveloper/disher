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
import { Instance } from 'mobx-state-tree';
import { ScheduleItem } from '@/domain/schedule/schedule';
import { useDailyScheduleModals } from '@/components/blocks/builders/food/ScheduleBuilder/modalContext';

type Props = {
  item: Instance<typeof ScheduleItem>;
  options: BuilderUIStore;
  className?: string;
};

const Item = ({ item, options, className }: Props) => {
  const modals = useDailyScheduleModals();

  console.log('LIST_ITEM', item);

  const onFoodsOpenUpdate = () => {
    item.setAsCurrent();
    modals.set('foodAdd');
  };

  const onQuantityOpen = () => {
    item.setAsCurrent();
    modals.set('quantity');
  };

  const onFoodsOpenInfo = () => {
    item.setAsCurrent();
    modals.set('foodNutrients');
  };

  const onDelete = () => item.markDeleted();
  const onRecover = () => item.recover();
  // const onTimeOpen = () => {
  //   item.setAsCurrent();
  //   modals.set('time');
  // };
  const onDishOpenInfo = () => {
    item.setAsCurrent();
    modals.set('dishNutrients');
  };

  const id = item.id;

  const getFoodName = useCallback(() => item.content?.name, [item]);
  console.log('item', item);
  // const getTime = useCallback(() => item.time || '00:00', [item]);
  const getQuantity = useCallback(() => item.quantity, [item]);

  const status = item.status;

  const showAdditionalsMode = options.showAdditionals;

  const isQuantityHide = useMemo(() => showAdditionalsMode, [showAdditionalsMode]);

  // item.dish

  const onNameAdditionalOptionsClick = () => {
    if (item.type === 'dish') {
      onDishOpenInfo();
      return;
    }
    onFoodsOpenInfo();
    return;
  };

  console.log('itemitem', toJS(item));

  const getVariantText = () => {
    if (item.content.type === 'custom') return 'кастомный продукт';
    if (item.content.type === 'dish') return 'блюдо';
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
      onRecover={onRecover}
      showAdditionals={showAdditionalsMode}
      id={id}
      status={status}
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
