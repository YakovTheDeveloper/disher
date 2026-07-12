import { type ComponentProps, type ReactNode } from 'react';
import { Card } from '@/shared/ui/atoms/Card';
import { EditableQuantity } from '@/shared/ui/atoms/EditableQuantity';
import { CardTime } from '@/shared/ui/atoms/CardTime';
import { FoodName } from '@/shared/ui/atoms/Typography/FoodName';
import { Text } from '@/shared/ui/atoms/Typography';
import { TapTarget } from '@/shared/ui/atoms/TapTarget';
import { formatClock } from '@/shared/lib/time/formatClock';
import styles from './FoodEntryCard.module.scss';

/**
 * FoodEntryCard — общий ПРЕЗЕНТАЦИОННЫЙ каркас карточки записи о еде. Свёрнут из
 * трёх почти-близнецов (ScheduleFoodItemInline / ProposalFoodItem / DishBuilderPage-
 * item), которые вручную собирали `Card` + `Card.Qty` + `TitleCluster` + `CardTime`
 * с одинаковым скелетом `[qty][имя+детали][время?]`.
 *
 * Разделение container/presentational: этот компонент — «тупой» презентатор (весь
 * скелет/цвет/геометрия), а доменные обёртки-контейнеры (расписание/предложка/dish)
 * остаются тонкими и мапят строку данных + мутации/сторы в пропсы ниже.
 *
 * Подложку (`Card.Root` = `LongPressRow`) конфигурируют пробрасываемые `...rowProps`
 * (id/index/tod/onLongPress/className/innerClassName/style/data-*), поэтому
 * каждый консумер сохраняет свой row-класс (`.group` / `.dishFoodListItem`) с leaf-
 * floor-обвязкой и tod-палитрой.
 */
type CardRootProps = Omit<ComponentProps<typeof Card.Root>, 'children'>;

export type FoodEntryCardProps = CardRootProps & {
  quantity: number;
  unit: string;
  onCommitQuantity: (quantity: number) => void;
  /** Screen прячет нижний бар на время инлайн-правки количества (только расписание). */
  qtyDataEntityEdit?: boolean;

  name: { name: string } | null;
  /** Голос/цвет имени по типу записи (dishTitle/foodTitle/customTitle/nameOriginal). */
  nameClassName?: string;
  /** input id для label-фокуса правки имени (keep-keyboard rename-флоу). */
  nameHtmlFor?: string;
  /** stash activeItemId/uid в dataset input'а на pointerdown ДО фокуса. */
  onNamePointerDown?: () => void;
  /** Особенности приёма («с кожурой») — инлайн card-caption после имени (wrap-поток). */
  details?: string;
  /** Довесок отдельной строкой ПОД именем (предложка: тихий «оригинал»-хинт). */
  belowName?: ReactNode;

  // ── время (опц. — dish-item время не несёт) ──
  time?: string;
  onCommitTime?: (time: string) => void;
  /** Dedup: время совпадает с рядом выше → сильно гасим (тап всё равно правит). */
  dimTime?: boolean;
  /** Глобальный toggle «спрятать время ряда» (расписание/предложка). */
  hideTime?: boolean;
};

export function FoodEntryCard({
  quantity,
  unit,
  onCommitQuantity,
  qtyDataEntityEdit,
  name,
  nameClassName,
  nameHtmlFor,
  onNamePointerDown,
  details,
  belowName,
  time,
  onCommitTime,
  dimTime,
  hideTime,
  ...rowProps
}: FoodEntryCardProps) {
  const showTime = time != null && onCommitTime != null && !hideTime;

  return (
    <Card.Root {...rowProps}>
      <Card.Qty>
        <EditableQuantity
          value={quantity}
          unit={unit}
          onCommit={onCommitQuantity}
          dataEntityEdit={qtyDataEntityEdit}
        />
      </Card.Qty>

      <Card.Title>
        {/* Имя = flex:1 тап-зона (label htmlFor — iOS-focus rename-флоу). Детали идут
            ИНЛАЙН после имени (FoodName.after, wrap-режим); belowName — строкой ниже. */}
        <TapTarget
          as="label"
          className={styles.name}
          htmlFor={nameHtmlFor}
          onPointerDown={onNamePointerDown}
        >
          <FoodName
            content={name}
            className={nameClassName}
            wrap
            after={
              details ? (
                <>
                  {' '}
                  <Text as="span" role="card-caption">
                    {details}
                  </Text>
                </>
              ) : undefined
            }
          />
          {belowName}
        </TapTarget>
      </Card.Title>

      {showTime && (
        <Card.Time>
          <CardTime value={time} onCommit={onCommitTime} formatDisplay={formatClock} dim={dimTime} />
        </Card.Time>
      )}
    </Card.Root>
  );
}

export default FoodEntryCard;
