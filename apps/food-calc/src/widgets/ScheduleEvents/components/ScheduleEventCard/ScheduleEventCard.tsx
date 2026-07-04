import React from 'react';
import styles from './ScheduleEventCard.module.scss';
import clsx from 'clsx';
import { Card } from '@/shared/ui/atoms/Card';
import type { ScheduleEvent } from '@/entities/schedule-event';
import type { Atom } from '@/entities/schedule-event/model/atoms';
import { getTimeOfDay } from '@/shared/lib/time-of-day';
import { useItemTimesStore } from '@/shared/model/itemTimesStore';
import { formatClock } from '@/shared/lib/time/formatClock';
import { Text } from '@/shared/ui/atoms/Typography';
import { TapTarget } from '@/shared/ui/atoms/TapTarget';

type Props = {
  item: ScheduleEvent;
  index?: number;
  totalCount?: number;
  onLongPress: () => void;
  onEditTime: () => void;
  onEditText: () => void;
  onEditAtoms: () => void;
  timeHtmlFor?: string;
  textHtmlFor?: string;
  atomsHtmlFor?: string;
  className?: string;
  /** True when the row above shares this row's time — the time is heavily faded
   *  (dedup, opacity 0.3 — not blanked) but stays tappable to edit. */
  dimTime?: boolean;
};

function formatAtomChip(atom: Atom, index: number) {
  switch (atom.kind) {
    case 'scale': {
      const pct = (atom.value / 10) * 100;
      return (
        <Text as="span" role="caption" className={clsx(styles.chip, styles.chipScale)} key={`scale-${index}`}>
          {atom.label && <span>{atom.label}</span>}
          <span className={styles.scaleBar}>
            <span className={styles.scaleFill} style={{ width: `${pct}%` }} />
          </span>
          <span>{atom.value}/10</span>
        </Text>
      );
    }
    case 'tag':
      return (
        <Text as="span" role="caption" className={clsx(styles.chip, styles.chipTag)} key={`tag-${index}`}>
          {atom.value}
        </Text>
      );
    case 'relation':
      return (
        <Text as="span" role="caption" className={clsx(styles.chip, styles.chipTag)} key={`rel-${index}`}>
          {atom.value}
        </Text>
      );
    default:
      return null;
  }
}

export function ScheduleEventCard({
  item,
  index = 0,
  totalCount = 1,
  onLongPress,
  onEditTime,
  onEditText,
  onEditAtoms,
  timeHtmlFor,
  textHtmlFor,
  atomsHtmlFor,
  className,
  dimTime = false,
}: Props) {
  const title = item.text || 'Новое событие';
  const atoms: Atom[] = Array.isArray(item.atoms) ? item.atoms : [];
  const hasAtoms = atoms.length > 0;
  // Global toggle (set from the TimeGroup time header): hide the per-row time.
  const hideTime = useItemTimesStore((s) => s.hidden);

  // Маппинг на compound Card (см. card-chassis-simplify план): Title = текст
  // (у события нет qty); Meta = теги-чипы (ТОЛЬКО при атомах — трейлинг-время
  // схлопывает нижний ряд); Time = время.
  return (
    <Card.Root
      className={clsx(className, styles.row)}
      style={{ '--item-t': totalCount > 1 ? index / (totalCount - 1) : 0 } as React.CSSProperties}
      id={item.id}
      index={index}
      tod={getTimeOfDay(item.time)}
      onLongPress={onLongPress}
    >
      {/* Title = текст события (Card строит body + label htmlFor). Дом affordance
          «+ данные» при collapse (юзер выбрал «тап по карточке целиком», 2026-06-25):
          когда атомов НЕТ, тап по заголовку (он = flex:1, заполняет карточку) ведёт в
          редактор атомов вместо текста — добавить данные = первичное действие пустого
          события. С атомами тап по заголовку правит текст (атомы правятся тапом по чипам). */}
      <Card.Title
        htmlFor={hasAtoms ? textHtmlFor : atomsHtmlFor}
        onTap={hasAtoms ? onEditText : onEditAtoms}
        className={styles.text}
      >
        {title}
      </Card.Title>

      {/* Meta = лента чипов: своя тап-зона оборачивает чипы → node-escape. Только при
          атомах — иначе Meta отсутствует, нижний ряд схлопывается, время едет в title-ряд. */}
      {hasAtoms && (
        <Card.Meta>
          <TapTarget as="label" htmlFor={atomsHtmlFor} className={styles.atomsZone} onClick={onEditAtoms}>
            {atoms.map((atom, i) => formatAtomChip(atom, i))}
          </TapTarget>
        </Card.Meta>
      )}

      {/* Time = низ-право (мессенджер-канон, как у еды ScheduleFoodItemInline). */}
      {!hideTime && (
        <Card.Time htmlFor={timeHtmlFor} onTap={onEditTime} dim={dimTime} className={styles.time}>
          {item.time ? formatClock(item.time) : '—'}
          {item.endTime && ` — ${formatClock(item.endTime)}`}
        </Card.Time>
      )}
    </Card.Root>
  );
}
