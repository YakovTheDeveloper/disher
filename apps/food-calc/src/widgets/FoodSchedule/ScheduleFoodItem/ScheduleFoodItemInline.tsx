import { memo, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './ScheduleFoodItemInline.module.scss';
import { FoodName } from '@/shared/ui/atoms/Typography/FoodName';
import { CardShell } from '@/features/shared/card-shell';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { updateScheduleFood } from '@/entities/schedule-food';
import { getTimeOfDay } from '@/shared/lib/time-of-day';
import { CardTime } from '@/shared/ui/atoms/CardTime';
import { QtyStack } from '@/shared/ui/atoms/QtyStack';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import { safeMutate } from '@/shared/lib/safeMutate';
import { getQtyUnit } from '@/shared/lib/servingUnit';
import { useItemTimesStore } from '@/shared/model/itemTimesStore';
import { formatClock } from '@/shared/lib/time/formatClock';
import { TapTarget } from '@/shared/ui/atoms/TapTarget';

type Props = {
  className?: string;
  item: ScheduleFoodWithRelations;
  index?: number;
  totalCount?: number;
  /** Long-press → per-item action drawer (built by FoodSchedule). */
  onLongPress?: () => void;
  /** True when the row above shares this row's time — the time is heavily faded
   *  (dedup, opacity 0.3 — not blanked) but stays tappable to edit. */
  dimTime?: boolean;
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
  onLongPress,
  dimTime = false,
  foodHtmlFor,
}: Props) => {
  const id = item.id;
  // Global toggle (set from the TimeGroup time header): hide the per-row time.
  const hideTime = useItemTimesStore((s) => s.hidden);

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

  // qty-стопка (value над unit, unit по началу value) — общий рендер для покоя
  // и правки; меняется только содержимое верхней строки (число ↔ NumberInput).
  const qtyStack = editingQty ? (
    <QtyStack
      unit={getQtyUnit(item.product)}
      // Глобальный хук: пока правим количество, Screen прячет нижний бар
      // (`Screen.module.scss` :has([data-entity-edit]:focus-within)).
      data-entity-edit
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
    </QtyStack>
  ) : (
    <QtyStack unit={getQtyUnit(item.product)} onClick={() => setEditingQty(true)}>
      {qtyDisplay}
    </QtyStack>
  );

  // Маппинг на CardShell (food-модель, см. cardshell-unification план):
  // title = [qty][имя] кластер (qty ПЕРЕД именем, упакованы); meta = детали;
  // metaEnd = время (теперь В карточке, не в левом желобе).
  return (
    <CardShell
      className={clsx(className, styles.group, isCustom && styles.customProduct)}
      style={{ '--item-t': totalCount > 1 ? index / (totalCount - 1) : 0 } as React.CSSProperties}
      id={id}
      index={index}
      tod={getTimeOfDay(item.time)}
      data-row-id={id}
      onLongPress={onLongPress}
      // title = [qty][имя] кластер (qty ПЕРЕД именем) — много-голосый узел → node-escape.
      title={{
        node: (
          <div className={styles.titleCluster}>
            {qtyStack}
            <TapTarget
              as="label"
              className={styles.foodName}
              htmlFor={foodHtmlFor}
              onPointerDown={handleFoodPointerDown}
            >
              <FoodName content={name} className={getFoodNameClassName()} />
            </TapTarget>
          </div>
        ),
      }}
      // meta = детали (CardLayout строит caption + label htmlFor); тот же htmlFor что имя.
      meta={
        item.details
          ? {
              content: item.details,
              htmlFor: foodHtmlFor,
              onPointerDown: handleFoodPointerDown,
              className: styles.detailsSubtitle,
            }
          : undefined
      }
      // metaEnd = время — stateful редактор → node-escape.
      metaEnd={
        hideTime
          ? undefined
          : {
              node: (
                <CardTime
                  value={item.time}
                  onCommit={commitTime}
                  formatDisplay={formatClock}
                  dim={dimTime}
                />
              ),
            }
      }
    />
  );
};

export default memo(ScheduleFoodItemInline);
