import styles from './ScheduleFoodItem.module.scss';
import { FoodName } from '@/shared/ui/atoms/Typography/FoodName';
import { Quantity } from '@/shared/ui/Quantity';
import { memo, useMemo } from 'react';
import clsx from 'clsx';
import { SelectableListItem } from '@/features/shared/selectable-list-item';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { SelectionStoreType, useStore } from '@/hooks/factoryHooks/useSelection';
import { costForWeight } from '@/shared/lib/cost';
import { isCreatedByUser } from '@/shared/lib/user';
import { getTimeOfDay } from '@/shared/lib/time-of-day';

type Props = {
  className?: string;
  item: ScheduleFoodWithRelations;
  index?: number;
  totalCount?: number;
  selectionStore: SelectionStoreType;
  showPrice?: boolean;
  onEditTime?: (item: ScheduleFoodWithRelations) => void;
  onEditFood?: (item: ScheduleFoodWithRelations) => void;
  onEditQuantity?: (item: ScheduleFoodWithRelations) => void;
  timeHtmlFor?: string;
  foodHtmlFor?: string;
  quantityHtmlFor?: string;
};

const ScheduleFoodItemComponent = ({
  item,
  className,
  index = 0,
  totalCount = 1,
  selectionStore,
  showPrice,
  onEditTime,
  onEditFood,
  onEditQuantity,
  timeHtmlFor,
  foodHtmlFor,
  quantityHtmlFor,
}: Props) => {
  const id = item.id;
  const isActionsMode = useStore(selectionStore, (s) => s.isActionsMode);
  const isSelected = useStore(selectionStore, (s) => s.selectedIds.includes(id));
  const toggleSelectedId = selectionStore.getState().toggleSelectedId;

  const content = item;

  const handleTimeClick = () => {
    onEditTime?.(item);
  };

  const handleFoodClick = () => {
    onEditFood?.(item);
  };

  const handleQuantityClick = () => {
    onEditQuantity?.(item);
  };

  const getVariantLabelText = () => {
    if (content?.type === 'food') return 'продукт';
    if (content?.type === 'dish') return 'блюдо';
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

  const name = content.food || content.dish;

  const isCustom = content.type === 'food' && isCreatedByUser(content.food?.userId);

  const pricePerKg = content.type === 'food' ? content.food?.pricePerKg : null;
  const cost = showPrice && pricePerKg != null ? costForWeight(pricePerKg, content.quantity) : null;

  return (
    <SelectableListItem
      className={clsx([className, styles.group, isCustom && styles.customProduct])}
      style={{ '--item-t': totalCount > 1 ? index / (totalCount - 1) : 0 } as React.CSSProperties}
      id={id}
      tod={getTimeOfDay(content.time)}
      data-schedule-food-id={id}
      isSelectMode={isActionsMode}
      isSelected={isSelected}
      onSelect={toggleSelectedId}
    >
      <label
        htmlFor={timeHtmlFor}
        onClick={handleTimeClick}
        style={{ cursor: onEditTime ? 'pointer' : 'default' }}
      >
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {content.time}
        </span>
      </label>
      <FoodName
        content={name}
        className={getFoodNameClassName()}
        onClick={handleFoodClick}
        htmlFor={foodHtmlFor}
      />
      <div className={styles.rightStack}>
        {cost != null && <span className={styles.priceText}>{cost.toFixed(1)}₽</span>}
        <Quantity
          id={id}
          content={content}
          onClick={onEditQuantity ? () => handleQuantityClick() : () => {}}
          hide={false}
          unit="г"
          htmlFor={quantityHtmlFor}
        />
      </div>
      {/* {afterName} */}
    </SelectableListItem>
  );
};

export default memo(ScheduleFoodItemComponent);
