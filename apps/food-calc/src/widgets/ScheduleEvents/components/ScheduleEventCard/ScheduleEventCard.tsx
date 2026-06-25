import React from 'react';
import styles from './ScheduleEventCard.module.scss';
import clsx from 'clsx';
import { LongPressRow } from '@/features/shared/long-press-item';
import type { ScheduleEvent } from '@/entities/schedule-event';
import type { Atom } from '@/entities/schedule-event/model/atoms';
import { getTimeOfDay } from '@/shared/lib/time-of-day';
import { useItemTimesStore } from '@/shared/model/itemTimesStore';
import { useRecentlyAddedStore } from '@/shared/model/recentlyAddedStore';
import { formatClock } from '@/shared/lib/time/formatClock';
import { Text } from '@/shared/ui/atoms/Typography';

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
  /** True when the row above shares this row's time — the time renders blank
   *  (dedup) but stays tappable to edit. */
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
  // «Недавно добавлено» — синий кружок справа (чистится на свайп/уход, см. store).
  const isRecent = useRecentlyAddedStore((s) => s.ids.has(item.id));

  return (
    <LongPressRow
      className={clsx(className, styles.row)}
      style={{ '--item-t': totalCount > 1 ? index / (totalCount - 1) : 0 } as React.CSSProperties}
      id={item.id}
      index={index}
      tod={getTimeOfDay(item.time)}
      recent={isRecent}
      // Opens the left time-gutter on the wrapper (see ScheduleFoodItemInline).
      data-row-gutter="time"
      onLongPress={onLongPress}
    >
      {!hideTime && (
        <label
          htmlFor={timeHtmlFor}
          className={clsx(styles.time, dimTime && styles.timeDup)}
          onClick={onEditTime}
        >
          {item.time ? formatClock(item.time) : '—'}
          {item.endTime && ` — ${formatClock(item.endTime)}`}
        </label>
      )}

      <Text as="label" role="body" htmlFor={textHtmlFor} className={styles.text} onClick={onEditText}>
        {title}
      </Text>

      <label
        htmlFor={atomsHtmlFor}
        className={clsx(styles.atomsZone, !hasAtoms && styles.atomsZoneEmpty)}
        onClick={onEditAtoms}
      >
        {hasAtoms ? (
          <span className={styles.atoms}>{atoms.map((atom, i) => formatAtomChip(atom, i))}</span>
        ) : (
          <Text as="span" role="caption" className={styles.atomsPlaceholder}>+ данные</Text>
        )}
      </label>
    </LongPressRow>
  );
}
