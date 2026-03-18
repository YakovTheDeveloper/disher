import { observer } from 'mobx-react-lite';
import styles from './DishListItemOnUniteProducts.module.scss';
import { BuilderUIStore } from '@/components/features/builders/shared/BuilderUIStore';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { ItemActions } from '@/components/features/builders/ScheduleBuilder/types';
import { Quantity } from '@/components/features/builders/shared/ui/Quantity';
import { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { DishItemUI } from '@/components/features/builders/DishBuilder/model/DishBuilderViewModel';
import { Instance } from 'mobx-state-tree';
import { Dish, DishItem } from '@/entities/dish';
import { useDishModals } from '@/components/features/builders/DishBuilder/modalContext';

type Props = {
  content: Instance<typeof DishItem>;
  options: BuilderUIStore;
  className?: string;
};

const DishListItemOnUniteProducts = ({ content, options, className }: Props) => {
  const onDelete = () => content.markDeleted();
  const onRecover = () => content.recover();

  const id = content.id;

  const getFoodName = useCallback(() => content.food?.name, [content]);
  const getQuantity = useCallback(() => content.effectiveQuantity, [content]);

  const status = content.status;

  return (
    <CommonListItem
      className={clsx([className, styles.group])}
      onDelete={onDelete}
      onRecover={onRecover}
      showAdditionals={true}
      id={id}
      status={status}
    >
      <FoodName id={id} hintMode={false} onClick={() => {}} onClickHintModeOn={() => {}}>
        {getFoodName}
      </FoodName>
      <Quantity id={id} onClick={() => {}} hide={false}>
        {getQuantity}
      </Quantity>
    </CommonListItem>
  );
};

export default observer(DishListItemOnUniteProducts);
