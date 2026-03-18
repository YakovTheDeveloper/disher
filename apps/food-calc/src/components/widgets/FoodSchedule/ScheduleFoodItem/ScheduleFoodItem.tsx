import styles from './ScheduleFoodItem.module.scss';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { Quantity } from '@/components/features/builders/shared/ui/Quantity';
import { useMemo } from 'react';
import clsx from 'clsx';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { SelectionStoreType, useStore } from '@/hooks/factoryHooks/useSelection';
type Props = {
  className?: string;
  item: ScheduleFoodWithRelations;
  selectionStore: SelectionStoreType;
  showCost?: boolean;
  costUnit?: string;
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
  selectionStore,
  showCost,
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

  // TODO: migrate to Triplit — content was an MST computed, now access flat fields
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

  const name = content.food || content.dish;

  const listItem = (
    <CommonListItem
      className={clsx([className, styles.group])}
      id={id}
      isSelectMode={isActionsMode}
      isSelected={isSelected}
      onSelect={toggleSelectedId}
    >
      <label htmlFor={timeHtmlFor} onClick={handleTimeClick} style={{ cursor: onEditTime ? 'pointer' : 'default' }}>
        <span style={{ fontSize: '0.85em', opacity: 0.7 }}>{content.time}</span>
      </label>
      <FoodName
        content={name}
        className={getFoodNameClassName()}
        onClick={handleFoodClick}
        htmlFor={foodHtmlFor}
      />
      <Quantity
        id={id}
        content={content}
        onClick={onEditQuantity ? () => handleQuantityClick() : () => {}}
        hide={false}
        unit="г"
        htmlFor={quantityHtmlFor}
      />
      {afterName}
    </CommonListItem>
  );

  if (!showCost) return listItem;

  return <div className={styles.costWrapper}>{listItem}</div>;
};

export default ScheduleFoodItemComponent;
