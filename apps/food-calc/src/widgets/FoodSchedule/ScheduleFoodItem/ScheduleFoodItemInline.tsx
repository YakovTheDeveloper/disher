import { memo } from 'react';
import clsx from 'clsx';
import styles from './ScheduleFoodItemInline.module.scss';
import { FoodName } from '@/shared/ui/atoms/Typography/FoodName';
import { Card } from '@/shared/ui/atoms/Card';
import { TitleCluster } from '@/shared/ui/atoms/TitleCluster';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { updateScheduleFood } from '@/entities/schedule-food';
import { getTimeOfDay } from '@/shared/lib/time-of-day';
import { CardTime } from '@/shared/ui/atoms/CardTime';
import { EditableQuantity } from '@/shared/ui/atoms/EditableQuantity';
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

  // Инлайн-правка количества — вынесена в EditableQuantity (был копипаст 1:1 с
  // ProposalFoodItem). dataEntityEdit: Screen прячет нижний бар на время правки.
  const qtyStack = (
    <EditableQuantity
      value={item.quantity}
      unit={getQtyUnit(item.product)}
      onCommit={(quantity) =>
        safeMutate(
          () => updateScheduleFood(item.id, { quantity }),
          'Не удалось обновить количество'
        )
      }
      dataEntityEdit
    />
  );

  // Маппинг на compound Card (food-модель, см. card-chassis-simplify план):
  // Title = [qty][имя] кластер; Meta = детали (опц.); Time = время (трейлинг —
  // есть детали → низ-право, нет → верх-право, рендерит Card.Root).
  return (
    <Card.Root
      className={clsx(className, styles.group, isCustom && styles.customProduct)}
      style={{ '--item-t': totalCount > 1 ? index / (totalCount - 1) : 0 } as React.CSSProperties}
      id={id}
      index={index}
      tod={getTimeOfDay(item.time)}
      data-row-id={id}
      onLongPress={onLongPress}
    >
      {/* Title = [qty][имя] кластер (qty ПЕРЕД именем) — много-голосый узел → node-escape. */}
      <Card.Title>
        <TitleCluster>
          {qtyStack}
          <TapTarget
            as="label"
            className={styles.foodName}
            htmlFor={foodHtmlFor}
            onPointerDown={handleFoodPointerDown}
          >
            <FoodName content={name} className={getFoodNameClassName()} />
          </TapTarget>
        </TitleCluster>
      </Card.Title>

      {/* Meta = детали (Card строит caption + label htmlFor + клэмп-2); тот же htmlFor что имя. */}
      {item.details && (
        <Card.Meta htmlFor={foodHtmlFor} onPointerDown={handleFoodPointerDown}>
          {item.details}
        </Card.Meta>
      )}

      {/* Time = stateful редактор → node-escape. */}
      {!hideTime && (
        <Card.Time>
          <CardTime value={item.time} onCommit={commitTime} formatDisplay={formatClock} dim={dimTime} />
        </Card.Time>
      )}
    </Card.Root>
  );
};

export default memo(ScheduleFoodItemInline);
