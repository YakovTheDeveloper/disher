import { useMemo, useRef, useEffect, memo, useCallback } from 'react';
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
  differenceInCalendarDays,
} from 'date-fns';
import { GroupedVirtuoso } from 'react-virtuoso';
import type { GroupedVirtuosoHandle } from 'react-virtuoso';
import styles from './ScheduleSelection2.module.scss';
import { ru } from 'date-fns/locale';
import { useAllScheduleFoods } from '@/entities/schedule-food';

const WEEKDAY_FULL = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
] as const;

const START_DATE = startOfMonth(new Date());

type DayRowProps = {
  day: Date;
  isSelected: boolean;
  isToday: boolean;
  isFilled: boolean;
  isLastVisited: boolean;
  onSelect: (date: string) => void;
};

const DayRow = memo(function DayRow({
  day,
  isSelected,
  isToday,
  isFilled,
  isLastVisited,
  onSelect,
}: DayRowProps) {
  const dateStr = format(day, 'dd-MM-yyyy');
  const weekday = WEEKDAY_FULL[day.getDay()];
  const dayNumber = format(day, 'd');
  const monthShort = format(day, 'LLL', { locale: ru });
  const relativeLabel = isToday ? 'Сегодня' : null;

  const className = [
    styles.dayRow,
    isSelected && styles.dayRowSelected,
    isToday && styles.dayRowToday,
    isFilled && styles.dayRowFilled,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={className} onClick={() => onSelect(dateStr)}>
      <span className={styles.dayMain}>
        <span className={styles.dayWeekday}>
          {weekday}
          {relativeLabel && <span className={styles.dayRelative}>, {relativeLabel.toLowerCase()}</span>}
        </span>
        <span className={styles.dayDate}>
          <span className={styles.dayNumber}>{dayNumber}</span>
          <span className={styles.dayMonth}>{monthShort}</span>
        </span>
      </span>
      <span className={styles.daySide}>
        {isFilled && <span className={styles.dayFilledDot} aria-label="есть записи" />}
        {isLastVisited && !isSelected && (
          <span className={styles.dayLastVisited}>прошлое посещение</span>
        )}
        <span className={styles.dayChevron} aria-hidden>
          ›
        </span>
      </span>
    </button>
  );
});

type Props = {
  onSelect: (date: string) => void;
  selectedDate?: string;
  showFastButtons?: boolean;
  className?: string;
  variant?: 'default' | 'experimental';
};

const LAST_VISITED_KEY = 'lastVisitedScheduleDate';

export const ScheduleSelection = ({
  onSelect,
  selectedDate,
  showFastButtons = false,
  className,
}: Props) => {
  const today = useMemo(() => startOfToday(), []);
  const virtuosoRef = useRef<GroupedVirtuosoHandle>(null);

  const months = useMemo(
    () => Array.from({ length: 24 }, (_, i) => addMonths(START_DATE, i - 12)),
    []
  );

  const { groupCounts, groupLabels, days, dayIndexByDateStr } = useMemo(() => {
    const counts: number[] = [];
    const labels: string[] = [];
    const flatDays: Date[] = [];
    const indexByDate = new Map<string, number>();

    for (const monthStart of months) {
      const monthEnd = endOfMonth(monthStart);
      const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
      counts.push(monthDays.length);
      labels.push(format(monthStart, 'LLLL yyyy', { locale: ru }));
      for (const d of monthDays) {
        indexByDate.set(format(d, 'dd-MM-yyyy'), flatDays.length);
        flatDays.push(d);
      }
    }
    return { groupCounts: counts, groupLabels: labels, days: flatDays, dayIndexByDateStr: indexByDate };
  }, [months]);

  const allScheduleFoods = useAllScheduleFoods();

  const filledDates = useMemo(() => {
    const set = new Set<string>();
    if (allScheduleFoods) {
      for (const item of allScheduleFoods) set.add(item.date);
    }
    return set;
  }, [allScheduleFoods]);

  const lastVisitedDate = useMemo(() => {
    try {
      return localStorage.getItem(LAST_VISITED_KEY);
    } catch {
      return null;
    }
  }, []);

  const selectedDateParsed = useMemo(
    () => (selectedDate ? parse(selectedDate, 'dd-MM-yyyy', new Date()) : null),
    [selectedDate]
  );

  const selectedDateStr = selectedDate ?? null;

  const initialIndex = useMemo(() => {
    const target = selectedDateParsed ?? today;
    const targetStr = format(target, 'dd-MM-yyyy');
    const idx = dayIndexByDateStr.get(targetStr);
    if (idx !== undefined) return Math.max(0, idx - 1);
    const monthDiff = differenceInMonths(startOfMonth(target), START_DATE);
    const monthIdx = Math.max(0, Math.min(months.length - 1, 12 + monthDiff));
    let acc = 0;
    for (let i = 0; i < monthIdx; i++) acc += groupCounts[i];
    return acc;
  }, [selectedDateParsed, today, dayIndexByDateStr, months.length, groupCounts]);

  useEffect(() => {
    if (!virtuosoRef.current || !selectedDateParsed) return;
    const targetStr = format(selectedDateParsed, 'dd-MM-yyyy');
    const idx = dayIndexByDateStr.get(targetStr);
    if (idx === undefined) return;
    virtuosoRef.current.scrollToIndex({
      index: Math.max(0, idx - 1),
      behavior: 'smooth',
    });
  }, [selectedDateParsed, dayIndexByDateStr]);

  const handleSelect = useCallback((date: string) => onSelect(date), [onSelect]);

  const renderItem = useCallback(
    (index: number) => {
      const day = days[index];
      const dateStr = format(day, 'dd-MM-yyyy');
      return (
        <DayRow
          day={day}
          isSelected={selectedDateStr === dateStr}
          isToday={isSameDay(day, today)}
          isFilled={filledDates.has(dateStr)}
          isLastVisited={lastVisitedDate === dateStr}
          onSelect={handleSelect}
        />
      );
    },
    [days, selectedDateStr, today, filledDates, lastVisitedDate, handleSelect]
  );

  const renderGroup = useCallback(
    (groupIndex: number) => (
      <div className={styles.monthHeader}>
        <span className={styles.monthHeaderText}>{groupLabels[groupIndex]}</span>
      </div>
    ),
    [groupLabels]
  );

  const fastBaseDate = selectedDateParsed ?? today;
  const goPrev = useCallback(() => {
    handleSelect(format(subDays(fastBaseDate, 1), 'dd-MM-yyyy'));
  }, [fastBaseDate, handleSelect]);
  const goNext = useCallback(() => {
    handleSelect(format(addDays(fastBaseDate, 1), 'dd-MM-yyyy'));
  }, [fastBaseDate, handleSelect]);
  const goToday = useCallback(() => {
    handleSelect(format(today, 'dd-MM-yyyy'));
  }, [today, handleSelect]);

  const fastBaseLabel = useMemo(() => {
    const diff = differenceInCalendarDays(fastBaseDate, today);
    if (diff === 0) return 'Сегодня';
    if (diff === -1) return 'Вчера';
    if (diff === 1) return 'Завтра';
    return format(fastBaseDate, 'd MMMM, EEEE', { locale: ru });
  }, [fastBaseDate, today]);

  return (
    <div className={`${styles.calendarWrapper} ${className || ''}`}>
      {showFastButtons && (
        <div className={styles.fastBar}>
          <button type="button" className={styles.fastArrow} onClick={goPrev} aria-label="Предыдущий день">
            ‹
          </button>
          <button type="button" className={styles.fastTodayLabel} onClick={goToday}>
            <span className={styles.fastTodayMain}>{fastBaseLabel}</span>
            <span className={styles.fastTodaySub}>нажмите, чтобы перейти к сегодня</span>
          </button>
          <button type="button" className={styles.fastArrow} onClick={goNext} aria-label="Следующий день">
            ›
          </button>
        </div>
      )}

      <GroupedVirtuoso
        ref={virtuosoRef}
        className={styles.scrollContainer}
        style={{ height: '100%', width: '100%' }}
        groupCounts={groupCounts}
        initialTopMostItemIndex={initialIndex}
        groupContent={renderGroup}
        itemContent={renderItem}
        increaseViewportBy={400}
      />
    </div>
  );
};

export default ScheduleSelection;
