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
import { ScheduleItem } from '@/domain/schedule';
import { useDailyScheduleModals } from '@/components/blocks/builders/food/ScheduleBuilder/modalContext';

type Props = {
  content: Instance<typeof ScheduleItem>;
  options: BuilderUIStore;
  className?: string;
};

const Item = ({ content, options, className }: Props) => {
  const modals = useDailyScheduleModals();

  console.log('LIST_ITEM', content);

  const onFoodsOpenUpdate = () => {
    content.setAsCurrent();
    modals.set('Food');
  };

  const onQuantityOpen = () => {
    content.setAsCurrent();
    modals.set('quantity');
  };

  const onFoodsOpenInfo = () => {
    content.setAsCurrent();
    modals.set('foodNutrients');
  };

  const onDelete = () => content.markDeleted();
  const onRecover = () => content.recover();
  const onTimeOpen = () => {
    content.setAsCurrent();
    modals.set('time');
  };
  const onDishOpenInfo = () => {
    content.setAsCurrent();
    modals.set('dishNutrients');
  };

  const id = content.id;

  const getFoodName = useCallback(() => content.name, [content]);
  console.log('content', content);
  const getTime = useCallback(() => content.time || '00:00', [content]);
  const getQuantity = useCallback(() => content.quantity, [content]);

  const status = content.status;

  const showAdditionalsMode = options.showAdditionals;

  const isQuantityHide = useMemo(() => showAdditionalsMode, [showAdditionalsMode]);

  // content.dish

  const onNameAdditionalOptionsClick = () => {
    if (content.type === 'dish') {
      onDishOpenInfo();
      return;
    }
    onFoodsOpenInfo();
    return;
  };

  console.log('contentcontent', toJS(content));

  const getVariantText = () => {
    if (content.type === 'custom') return 'кастомный продукт';
    if (content.type === 'dish') return 'блюдо';
    return 'продукт';
    // if (content.food) return 'продукт';
  };

  const getFoodNameClassName = () => {
    console.log('f', content);
    const prefix = content.type;
    return styles[`${prefix}Title`];
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
        onClick={onFoodsOpenUpdate}
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
