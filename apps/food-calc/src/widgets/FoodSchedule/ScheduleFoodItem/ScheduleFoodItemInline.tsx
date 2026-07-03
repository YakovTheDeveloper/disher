import { memo } from 'react';
import clsx from 'clsx';
import styles from './ScheduleFoodItemInline.module.scss';
import { FoodEntryCard } from '@/shared/ui/atoms/FoodEntryCard';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { updateScheduleFood } from '@/entities/schedule-food';
import { getTimeOfDay } from '@/shared/lib/time-of-day';
import { safeMutate } from '@/shared/lib/safeMutate';
import { getQtyUnit } from '@/shared/lib/servingUnit';
import { useItemTimesStore } from '@/shared/model/itemTimesStore';
import { useRecentlyAddedStore } from '@/shared/model/recentlyAddedStore';

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
  // «Недавно добавлено» — паритет с событиями (ScheduleEventCard): синий кружок
  // справа + разовый flash фона на созданном ряду (LongPressRow по `recent`).
  const isRecent = useRecentlyAddedStore((s) => s.ids.has(id));

  const commitTime = (time: string) => {
    safeMutate(() => updateScheduleFood(item.id, { time }), 'Не удалось обновить время');
  };

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

  // Тонкий контейнер: мапим строку расписания + мутации/сторы в пропсы общего
  // презентационного FoodEntryCard (скелет [qty][имя+детали][время] — там же).
  return (
    <FoodEntryCard
      className={clsx(className, styles.group, isCustom && styles.customProduct)}
      style={{ '--item-t': totalCount > 1 ? index / (totalCount - 1) : 0 } as React.CSSProperties}
      id={id}
      index={index}
      tod={getTimeOfDay(item.time)}
      recent={isRecent}
      onLongPress={onLongPress}
      quantity={item.quantity}
      unit={getQtyUnit(item.product)}
      onCommitQuantity={(quantity) =>
        safeMutate(
          () => updateScheduleFood(item.id, { quantity }),
          'Не удалось обновить количество'
        )
      }
      qtyDataEntityEdit
      name={name}
      nameClassName={getFoodNameClassName()}
      nameHtmlFor={foodHtmlFor}
      onNamePointerDown={handleFoodPointerDown}
      details={item.details || undefined}
      time={item.time}
      onCommitTime={commitTime}
      dimTime={dimTime}
      hideTime={hideTime}
    />
  );
};

export default memo(ScheduleFoodItemInline);
