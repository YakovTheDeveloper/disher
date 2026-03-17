import { observer } from 'mobx-react-lite';
import styles from './ScheduleFoodItem.module.scss';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { Quantity } from '@/components/features/builders/shared/ui/Quantity';
import { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { domainStore } from '@/store/store';
import { useNavigate, useParams } from 'react-router';
import { RouterLinks } from '@/router';

import { ScheduleFoodsItem as ScheduleFoodItemModel } from '@/domain/schedule/scheduleFood/ScheduleFoods.model';
import { Instance } from 'mobx-state-tree';
import { SelectionStoreType, useSelection } from '@/hooks/factoryHooks/useSelection';
import { useAppRoutes } from '@/app/routing/useAppRoutes';

type Props = {
  scheduleId: string;
  className?: string;
  item: Instance<typeof ScheduleFoodItemModel>;
  selectionStore: SelectionStoreType;
  showCost?: boolean;
  costUnit?: string;
};

const ScheduleFoodItemComponent = ({ scheduleId, item, className, selectionStore, showCost, costUnit = '₽' }: Props) => {
  const { toScheduleFood } = useAppRoutes();

  const id = item.id;
  const content = item.content;

  const onFoodsOpenUpdate = () => {
    toScheduleFood(scheduleId, item.id);
  };

  const getVariantLabelText = () => {
    if (content?.variant === 'product') {
      if (content.isCustom) return 'кастом';
      else return 'продукт';
    }
    if (content?.variant === 'dish') return 'блюдо';

    return '';
  };

  const getFoodNameClassName = () => {
    const prefix = content?.variant;
    if (!prefix) return '';
    return styles[`${prefix}Title`];
  };

  const afterName = useMemo(() => {
    return <p className={styles.variant}>{getVariantLabelText()}</p>;
  }, [content]);

  const costText = useMemo(() => {
    if (!showCost) return null;
    const entity = content?.food ?? content?.dish;
    if (!entity || !entity.hasCost) return `— ${costUnit}`;
    const cost = entity.costForWeight(content!.quantity);
    return `${cost.toFixed(1)} ${costUnit}`;
  }, [showCost, content, costUnit]);

  const listItem = (
    <CommonListItem
      className={clsx([className, styles.group])}
      id={id}
      isSelectMode={selectionStore.isActionsMode}
      isSelected={selectionStore.isSelected(id)}
      onSelect={selectionStore.toggleSelectedId}
    >
      <FoodName content={content} className={getFoodNameClassName()} onClick={onFoodsOpenUpdate} />
      <Quantity id={id} content={content} />
      {afterName}
    </CommonListItem>
  );

  if (!showCost) return listItem;

  return (
    <div className={styles.costWrapper}>
      {listItem}
      <span className={clsx(styles.cost, { [styles.cost_empty]: costText?.startsWith('—') })}>
        {costText}
      </span>
    </div>
  );
};

export default observer(ScheduleFoodItemComponent);
