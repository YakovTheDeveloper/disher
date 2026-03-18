import styles from './ScheduleFoodItem.module.scss';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { Quantity } from '@/components/features/builders/shared/ui/Quantity';
import { useMemo } from 'react';
import clsx from 'clsx';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { useNavigate, useParams } from 'react-router';
import { RouterLinks } from '@/router';
import type { ScheduleFood } from '@/entities/schedule-food';
import { SelectionStoreType, useSelection } from '@/hooks/factoryHooks/useSelection';
import { useAppRoutes } from '@/app/routing/useAppRoutes';

type Props = {
  scheduleId: string;
  className?: string;
  item: ScheduleFood;
  selectionStore: SelectionStoreType;
  showCost?: boolean;
  costUnit?: string;
};

const ScheduleFoodItemComponent = ({ scheduleId, item, className, selectionStore, showCost, costUnit = '\u20BD' }: Props) => {
  const { toScheduleFood } = useAppRoutes();

  const id = item.id;
  const content = item.content;

  const onFoodsOpenUpdate = () => {
    toScheduleFood(scheduleId, item.id);
  };

  const getVariantLabelText = () => {
    if (content?.variant === 'product') {
      if (content.isCustom) return '\u043A\u0430\u0441\u0442\u043E\u043C';
      else return '\u043F\u0440\u043E\u0434\u0443\u043A\u0442';
    }
    if (content?.variant === 'dish') return '\u0431\u043B\u044E\u0434\u043E';

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
    if (!entity || !entity.hasCost) return `\u2014 ${costUnit}`;
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
      <span className={clsx(styles.cost, { [styles.cost_empty]: costText?.startsWith('\u2014') })}>
        {costText}
      </span>
    </div>
  );
};

export default ScheduleFoodItemComponent;
