import { useMemo } from 'react';
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
} from 'date-fns';
import { Virtuoso } from 'react-virtuoso';
import styles from './ScheduleSelection2.module.scss';
import { observer } from 'mobx-react-lite';
import { ru } from 'date-fns/locale';
import { NavLink } from 'react-router';
import { RouterLinks } from '@/router';

const SHORT_DAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'] as const;
const START_DATE = startOfMonth(new Date());

type Props = {
  onSelect: (date: string) => void;
  selectedDate?: string;
  showFastButtons?: boolean;
  className?: string;
};

export const ScheduleSelection = ({
  onSelect,
  selectedDate,
  showFastButtons = false,
  className,
}: Props) => {
  const today = startOfToday();

  const months = useMemo(
    () => Array.from({ length: 24 }, (_, i) => addMonths(START_DATE, i - 12)),
    [],
  );

  const selectedDateParsed = useMemo(
    () => (selectedDate ? parse(selectedDate, 'dd-MM-yyyy', new Date()) : null),
    [selectedDate],
  );

  const renderMonth = (index: number) => {
    const monthStart = months[index];
    const monthEnd = endOfMonth(monthStart);

    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const firstDayOfWeek = monthStart.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const emptyCells = Array.from({ length: startOffset }, (_, i) => (
      <div key={`empty-${index}-${i}`} className={styles.emptyDay} />
    ));

    return (
      <div className={styles.monthSection}>
        <div className={styles.stickyHeader}>
          <span className={styles.monthName}>
            {format(monthStart, 'LLLL', { locale: ru })}
          </span>
          <span className={styles.monthYear}>{format(monthStart, 'yyyy')}</span>
        </div>
        <div className={styles.daysGrid}>
          {emptyCells}
          {daysInMonth.map((day) => {
            const isSelected = selectedDateParsed && isSameDay(day, selectedDateParsed);
            const isCurrentDay = isSameDay(day, today);
            const dayOfWeek = SHORT_DAYS[day.getDay()];

            return (
              <button
                key={day.toISOString()}
                className={`${styles.day} ${isSelected ? styles.selected : ''} ${isCurrentDay ? styles.today : ''}`}
                onClick={() => onSelect(format(day, 'dd-MM-yyyy'))}
              >
                <span className={styles.dayNumber}>{format(day, 'd')}</span>
                <span className={styles.dayName}>{dayOfWeek}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.calendarWrapper} ${className || ''}`}>
      <div className={styles.weekDaysHeader}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <Virtuoso
        className={styles.scrollContainer}
        style={{ height: '100%', width: '100%' }}
        data={months}
        initialTopMostItemIndex={12}
        itemContent={(index) => renderMonth(index)}
        increaseViewportBy={300}
      />

      {showFastButtons && (
        <div className={styles.links}>
          <NavLink
            to={RouterLinks.ScheduleBuilder + '/' + format(subDays(startOfToday(), 1), 'dd-MM-yyyy')}
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
            to={RouterLinks.ScheduleBuilder + '/' + format(addDays(startOfToday(), 1), 'dd-MM-yyyy')}
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
