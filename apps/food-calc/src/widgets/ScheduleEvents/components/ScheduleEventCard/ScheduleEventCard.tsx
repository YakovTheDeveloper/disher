import React from 'react';
import styles from './ScheduleEventCard.module.scss';
import clsx from 'clsx';
import { LongPressRow } from '@/features/shared/long-press-item';
import type { ScheduleEvent } from '@/entities/schedule-event';
import type { Atom } from '@/entities/schedule-event/model/atoms';
import { getTimeOfDay } from '@/shared/lib/time-of-day';

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
};

function formatAtomChip(atom: Atom, index: number) {
  switch (atom.kind) {
    case 'scale': {
      const pct = (atom.value / 10) * 100;
      return (
        <span className={clsx(styles.chip, styles.chipScale)} key={`scale-${index}`}>
          {atom.label && <span>{atom.label}</span>}
          <span className={styles.scaleBar}>
            <span className={styles.scaleFill} style={{ width: `${pct}%` }} />
          </span>
          <span>{atom.value}/10</span>
        </span>
      );
    }
    case 'tag':
      return (
        <span className={clsx(styles.chip, styles.chipTag)} key={`tag-${index}`}>
          {atom.value}
        </span>
      );
    case 'relation':
      return (
        <span className={clsx(styles.chip, styles.chipTag)} key={`rel-${index}`}>
          {atom.value}
        </span>
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
}: Props) {
  const title = item.text || 'Новое событие';
  const atoms: Atom[] = Array.isArray(item.atoms) ? item.atoms : [];
  const hasAtoms = atoms.length > 0;

  return (
    <LongPressRow
      className={clsx(className, styles.row)}
      style={{ '--item-t': totalCount > 1 ? index / (totalCount - 1) : 0 } as React.CSSProperties}
      id={item.id}
      tod={getTimeOfDay(item.time)}
      onLongPress={onLongPress}
    >
      <label htmlFor={timeHtmlFor} className={styles.time} onClick={onEditTime}>
        {item.time || '—'}
        {item.endTime && ` — ${item.endTime}`}
      </label>

      <label htmlFor={textHtmlFor} className={styles.text} onClick={onEditText}>
        {title}
      </label>

      <label
        htmlFor={atomsHtmlFor}
        className={clsx(styles.atomsZone, !hasAtoms && styles.atomsZoneEmpty)}
        onClick={onEditAtoms}
      >
        {hasAtoms ? (
          <span className={styles.atoms}>{atoms.map((atom, i) => formatAtomChip(atom, i))}</span>
        ) : (
          <span className={styles.atomsPlaceholder}>+ данные</span>
        )}
      </label>
    </LongPressRow>
  );
}
