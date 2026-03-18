import styles from './ScheduleFoodItem.module.scss';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { Quantity } from '@/components/features/builders/shared/ui/Quantity';
import { useMemo } from 'react';
import clsx from 'clsx';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import type { ScheduleFood } from '@/entities/schedule-food';
import { SelectionStoreType } from '@/hooks/factoryHooks/useSelection';
import { useAppRoutes } from '@/app/routing/useAppRoutes';

type Props = {
  scheduleId: string;
  className?: string;
  item: ScheduleFood;
  selectionStore: SelectionStoreType;
  showCost?: boolean;
  costUnit?: string;
};

const ScheduleFoodItemComponent = ({ scheduleId, item, className, selectionStore, showCost }: Props) => {
  const { toScheduleFood } = useAppRoutes();

  const id = item.id;
  // TODO: migrate to Triplit — content was an MST computed, now access flat fields
  const content = item as any;

  const onFoodsOpenUpdate = () => {
    toScheduleFood(scheduleId, item.id);
  };

  const getVariantLabelText = () => {
    if (content?.type === 'food') {
      return '\u043F\u0440\u043E\u0434\u0443\u043A\u0442';
    }
    if (content?.type === 'dish') return '\u0431\u043B\u044E\u0434\u043E';

    return '';
  };

  const getFoodNameClassName = () => {
    const prefix = content?.type;
    if (!prefix) return '';
    return styles[`${prefix}Title`] ?? '';
  };

  const afterName = useMemo(() => {
    return <p className={styles.variant}>{getVariantLabelText()}</p>;
  }, [content]);

  const listItem = (
    <CommonListItem
      className={clsx([className, styles.group])}
      id={id}
      isSelectMode={selectionStore.isActionsMode}
      isSelected={selectionStore.isSelected(id)}
      onSelect={selectionStore.toggleSelectedId}
    >
      <FoodName content={content} className={getFoodNameClassName()} onClick={onFoodsOpenUpdate} />
      <Quantity id={id} content={content} onClick={() => {}} hide={false} unit="г" />
      {afterName}
    </CommonListItem>
  );

  if (!showCost) return listItem;

  return (
    <div className={styles.costWrapper}>
      {listItem}
    </div>
  );
};

export default ScheduleFoodItemComponent;
