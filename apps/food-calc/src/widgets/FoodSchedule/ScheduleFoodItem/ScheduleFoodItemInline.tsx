import { memo, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './ScheduleFoodItemInline.module.scss';
import { FoodName } from '@/shared/ui/atoms/Typography/FoodName';
import { SelectableListItem } from '@/features/shared/selectable-list-item';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { updateScheduleFood } from '@/entities/schedule-food';
import { SelectionStoreType, useStore } from '@/hooks/factoryHooks/useSelection';
import { getTimeOfDay } from '@/shared/lib/time-of-day';
import { useRecentlyAddedStore } from '@/features/food/food-free-text-parse';
import { InlineTimeEditor } from '@/shared/ui/TimeChoose';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import { safeMutate } from '@/shared/lib/safeMutate';
import { getQtyUnit } from '@/shared/lib/servingUnit';

type Props = {
  className?: string;
  item: ScheduleFoodWithRelations;
  index?: number;
  totalCount?: number;
  selectionStore: SelectionStoreType;
  foodHtmlFor?: string;
  // Accepted for backwards-compatible call sites; unused — Inline edits in place.
  onEditTime?: (item: ScheduleFoodWithRelations) => void;
  onEditFood?: (item: ScheduleFoodWithRelations) => void;
  onEditQuantity?: (item: ScheduleFoodWithRelations) => void;
  timeHtmlFor?: string;
  quantityHtmlFor?: string;
};

const ScheduleFoodItemInline = ({
  item,
  className,
  index = 0,
  totalCount = 1,
  selectionStore,
  foodHtmlFor,
}: Props) => {
  const id = item.id;
  const isActionsMode = useStore(selectionStore, (s) => s.isActionsMode);
  const isSelected = useStore(selectionStore, (s) => s.selectedIds.includes(id));
  const toggleSelectedId = selectionStore.getState().toggleSelectedId;
  const isRecentFromFreeText = useRecentlyAddedStore((s) => s.ids.has(id));

  useEffect(() => {
    if (!isRecentFromFreeText) return;
    const timer = setTimeout(() => {
      useRecentlyAddedStore.getState().remove(id);
    }, 15000);
    return () => clearTimeout(timer);
  }, [isRecentFromFreeText, id]);

  const commitTime = (time: string) => {
    safeMutate(
      () => updateScheduleFood(item.id, { time }),
      'Не удалось обновить время'
    );
  };

  // ── Quantity inline edit ────────────────────────────────────────────
  const [editingQty, setEditingQty] = useState(false);
  const [qtyDraft, setQtyDraft] = useState(item.quantity);
  // After commit, keep showing the optimistic value until props.quantity
  // catches up (avoids old→new flash while PowerSync round-trips).
  const [qtyPending, setQtyPending] = useState<number | null>(null);

  useEffect(() => {
    if (!editingQty) setQtyDraft(item.quantity);
  }, [item.quantity, editingQty]);

  useEffect(() => {
    if (qtyPending !== null && qtyPending === item.quantity) setQtyPending(null);
  }, [qtyPending, item.quantity]);

  const commitQty = () => {
    if (qtyDraft === item.quantity || qtyDraft <= 0) {
      setEditingQty(false);
      setQtyDraft(item.quantity);
      return;
    }
    setQtyPending(qtyDraft);
    safeMutate(
      () => updateScheduleFood(item.id, { quantity: qtyDraft }),
      'Не удалось обновить количество'
    );
    setEditingQty(false);
  };

  const qtyDisplay = qtyPending ?? item.quantity;

  const qtyInputRef = useRef<HTMLInputElement>(null);

  // <label htmlFor={SEARCH_EDIT_INPUT}> in FoodName focuses the always-mounted
  // edit-search input directly (Yandex-style — keeps iOS keyboard popping). We
  // stash our item id on the input synchronously on pointerdown so the focus
  // capture handler in FoodSchedule knows which item to prime for editing.
  const handleFoodPointerDown = () => {
    if (foodHtmlFor) {
      const trigger = document.getElementById(foodHtmlFor);
      if (trigger) trigger.dataset.activeItemId = id;
    }
  };

  const getFoodNameClassName = () => {
    const prefix = item.type;
    if (!prefix) return '';
    return styles[`${prefix}Title`] ?? '';
  };

  const name = item.product ?? item.dish ?? null;
  const isCustom = item.type === 'food' && (item.product?.isUserCreated ?? false);

  return (
    <SelectableListItem
      className={clsx([
        className,
        styles.group,
        isCustom && styles.customProduct,
      ])}
      wrapperClassName={clsx(isRecentFromFreeText && styles.recentFreeTextWrapper)}
      style={{ '--item-t': totalCount > 1 ? index / (totalCount - 1) : 0 } as React.CSSProperties}
      id={id}
      tod={getTimeOfDay(item.time)}
      data-schedule-food-id={id}
      isSelectMode={isActionsMode}
      isSelected={isSelected}
      onSelect={toggleSelectedId}
    >
      <InlineTimeEditor
        value={item.time}
        onCommit={commitTime}
        displayClassName={styles.timeDisplay}
        editClassName={styles.timeEdit}
      />

      <label
        className={styles.foodCol}
        htmlFor={foodHtmlFor}
        onPointerDown={handleFoodPointerDown}
      >
        <FoodName
          content={name}
          className={getFoodNameClassName()}
        />
        {item.details ? (
          <span className={styles.detailsSubtitle}>{item.details}</span>
        ) : null}
      </label>

      <div className={styles.rightStack}>
        {editingQty ? (
          <span
            className={styles.qtyEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.querySelector('input')?.blur();
              } else if (e.key === 'Escape') {
                setQtyDraft(item.quantity);
                setEditingQty(false);
              }
            }}
          >
            <NumberInput
              ref={qtyInputRef}
              value={qtyDraft}
              onChange={setQtyDraft}
              onBlur={commitQty}
              autoFocus
              min={1}
              maxLength={4}
            />
            <span className={styles.qtyUnit}>{getQtyUnit(item.product)}</span>
          </span>
        ) : (
          <span
            className={styles.qtyEdit}
            onClick={() => setEditingQty(true)}
          >
            {qtyDisplay}
            <span className={styles.qtyUnit}>{getQtyUnit(item.product)}</span>
          </span>
        )}
      </div>
    </SelectableListItem>
  );
};

export default memo(ScheduleFoodItemInline);
