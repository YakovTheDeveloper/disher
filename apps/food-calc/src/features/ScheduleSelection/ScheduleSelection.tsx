import { useMemo, useRef, useEffect } from 'react';
import {
  format,
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfToday,
  subDays,
  parse,
  differenceInMonths,
} from 'date-fns';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';
import styles from './ScheduleSelection2.module.scss';
import { observer } from 'mobx-react-lite';
import { ru } from 'date-fns/locale';
import { NavLink } from 'react-router';
import { RouterLinks } from '@/app/router';

const SHORT_DAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'] as const;
const START_DATE = startOfMonth(new Date());

type Props = {
  onSelect: (date: string) => void;
  selectedDate?: string;
  showFastButtons?: boolean;
  className?: string;
  variant?: 'default' | 'experimental';
};

export const ScheduleSelection = ({
  onSelect,
  selectedDate,
  showFastButtons = false,
  className,
  variant = 'default',
}: Props) => {
  const isExperimental = variant === 'experimental';
  const today = startOfToday();
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const months = useMemo(
    () => Array.from({ length: 24 }, (_, i) => addMonths(START_DATE, i - 12)),
    []
  );

  const selectedDateParsed = useMemo(
    () => (selectedDate ? parse(selectedDate, 'dd-MM-yyyy', new Date()) : null),
    [selectedDate]
  );

  const initialIndex = useMemo(() => {
    if (!selectedDateParsed) return 12;
    const selectedMonth = startOfMonth(selectedDateParsed);
    const diff = differenceInMonths(selectedMonth, START_DATE);
    const idx = 12 + diff;
    return Math.max(0, Math.min(23, idx));
  }, [selectedDateParsed]);

  useEffect(() => {
    if (virtuosoRef.current && selectedDateParsed) {
      const selectedMonth = startOfMonth(selectedDateParsed);
      const diff = differenceInMonths(selectedMonth, START_DATE);
      const idx = 12 + diff;
      if (idx >= 0 && idx <= 23) {
        virtuosoRef.current.scrollToIndex({ index: idx, behavior: 'smooth' });
      }
    }
  }, [selectedDateParsed]);

  const renderMonth = (index: number) => {
    const monthStart = months[index];
    const monthEnd = endOfMonth(monthStart);

    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const firstDayOfWeek = monthStart.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const emptyCells = Array.from({ length: startOffset }, (_, i) => (
      <div key={`empty-${index}-${i}`} className={styles.emptyDay} />
    ));

    const monthLabel = format(monthStart, 'LLLL', { locale: ru });

    return (
      <div className={styles.monthSection}>
        {!isExperimental && (
          <div className={styles.stickyHeader}>
            <span className={styles.monthName}>{monthLabel}</span>
            <span className={styles.monthYear}>{format(monthStart, 'yyyy')}</span>
          </div>
        )}
        <div
          className={`${styles.daysGrid} ${isExperimental ? styles.daysGridExperimental : ''}`}
          data-month={isExperimental ? monthLabel : undefined}
        >
          {emptyCells}
          {daysInMonth.map((day) => {
            const isSelected = selectedDateParsed && isSameDay(day, selectedDateParsed);
            const isCurrentDay = isSameDay(day, today);
            const dayOfWeek = SHORT_DAYS[day.getDay()];

            return (
              <button
                key={day.toISOString()}
                className={`${styles.day} ${isExperimental ? styles.dayExperimental : ''} ${isSelected ? styles.selected : ''} ${isCurrentDay ? styles.today : ''}`}
                onClick={() => onSelect(format(day, 'dd-MM-yyyy'))}
              >
                <span className={styles.dayNumber}>{format(day, 'd')}</span>
                <span
                  className={`${styles.dayName} ${isExperimental ? styles.dayNameExperimental : ''}`}
                >
                  {dayOfWeek}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.calendarWrapper} ${className || ''}`}>
      {!isExperimental && (
        <div className={styles.weekDaysHeader}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
      )}

      <Virtuoso
        ref={virtuosoRef}
        className={styles.scrollContainer}
        style={{ height: '100%', width: '100%' }}
        data={months}
        initialTopMostItemIndex={initialIndex}
        itemContent={(index) => renderMonth(index)}
        increaseViewportBy={300}
      />

      {showFastButtons && (
        <div className={styles.links}>
          <NavLink
            to={
              RouterLinks.ScheduleBuilder + '/' + format(subDays(startOfToday(), 1), 'dd-MM-yyyy')
            }
            className={styles.goDay}
          >
            <span className={styles.linkButtonText}>Вчера</span>
          </NavLink>
          <NavLink
            to={RouterLinks.ScheduleBuilder + '/' + format(startOfToday(), 'dd-MM-yyyy')}
            className={styles.goDay}
          >
            <span className={styles.linkButtonText}>Сегодня</span>
          </NavLink>
          <NavLink
            to={
              RouterLinks.ScheduleBuilder + '/' + format(addDays(startOfToday(), 1), 'dd-MM-yyyy')
            }
            className={styles.goDay}
          >
            <span className={styles.linkButtonText}>Завтра</span>
          </NavLink>
        </div>
      )}
    </div>
  );
};

export default observer(ScheduleSelection);
