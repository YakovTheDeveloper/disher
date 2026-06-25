import React from 'react';
import styles from './ScheduleEventCard.module.scss';
import clsx from 'clsx';
import { CardShell } from '@/features/shared/card-shell';
import type { ScheduleEvent } from '@/entities/schedule-event';
import type { Atom } from '@/entities/schedule-event/model/atoms';
import { getTimeOfDay } from '@/shared/lib/time-of-day';
import { useItemTimesStore } from '@/shared/model/itemTimesStore';
import { useRecentlyAddedStore } from '@/shared/model/recentlyAddedStore';
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
  // «Недавно добавлено» — синий кружок справа (чистится на свайп/уход, см. store).
  const isRecent = useRecentlyAddedStore((s) => s.ids.has(item.id));

  // Маппинг на CardShell-слоты (см. cardshell-unification план): title = текст,
  // titleEnd — нет (у события нет qty), meta = теги-чипы, metaEnd = время.
  return (
    <CardShell
      className={clsx(className, styles.row)}
      style={{ '--item-t': totalCount > 1 ? index / (totalCount - 1) : 0 } as React.CSSProperties}
      id={item.id}
      index={index}
      tod={getTimeOfDay(item.time)}
      recent={isRecent}
      onLongPress={onLongPress}
      // title = текст события (CardLayout строит body + label htmlFor).
      title={{
        content: title,
        htmlFor: textHtmlFor,
        onTap: onEditText,
        className: styles.text,
      }}
      // titleEnd = время. У события нет qty, поэтому время поднимается на базовую
      // линию заголовка (верх-право, role:'time' переопределяет qty-роль слота),
      // а не падает в правый-нижний угол как у еды. См. CardLayout role-override.
      titleEnd={
        hideTime
          ? undefined
          : {
              content: (
                <>
                  {item.time ? formatClock(item.time) : '—'}
                  {item.endTime && ` — ${formatClock(item.endTime)}`}
                </>
              ),
              role: 'time',
              htmlFor: timeHtmlFor,
              onTap: onEditTime,
              className: dimTime ? styles.timeDup : undefined,
            }
      }
      // meta = лента чипов / «+ данные»: своя тап-зона оборачивает чипы → node-escape.
      meta={{
        node: (
          <TapTarget
            as="label"
            htmlFor={atomsHtmlFor}
            className={clsx(styles.atomsZone, !hasAtoms && styles.atomsZoneEmpty)}
            onClick={onEditAtoms}
          >
            {hasAtoms ? (
              atoms.map((atom, i) => formatAtomChip(atom, i))
            ) : (
              <Text as="span" role="caption" className={styles.atomsPlaceholder}>+ данные</Text>
            )}
          </TapTarget>
        ),
      }}
    />
  );
}
