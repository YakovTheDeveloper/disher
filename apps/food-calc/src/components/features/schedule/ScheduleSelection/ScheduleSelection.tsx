import React, { useMemo, useRef } from 'react';
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  // isSameMonth,
  startOfToday,
} from 'date-fns';
import { Virtuoso } from 'react-virtuoso';
import styles from './ScheduleSelection2.module.scss';
import { observer } from 'mobx-react-lite';
import { ru } from 'date-fns/locale';
import { NavLink } from 'react-router';
import { RouterLinks } from '@/router';

const START_DATE = startOfMonth(new Date());

export const ScheduleSelection = ({ onSelect, selectedDate }) => {
  const today = startOfToday();

  const months = useMemo(() => {
    const allMonths = Array.from({ length: 24 }, (_, i) => addMonths(START_DATE, i - 12));
    return allMonths;
  }, []);

  const renderMonth = (index: number) => {
    const monthStart = months[index];
    const monthEnd = endOfMonth(monthStart);

    const daysInMonth = eachDayOfInterval({
      start: monthStart,
      end: monthEnd,
    });

    const firstDayOfWeek = monthStart.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const emptyCells = Array.from({ length: startOffset }, (_, i) => (
      <div key={`empty-${index}-${i}`} className={styles.emptyDay}></div>
    ));

    return (
      <div className={styles.monthSection}>
        <div className={styles.stickyHeader}>{format(monthStart, 'LLLL yyyy', { locale: ru })}</div>
        <div className={styles.daysGrid}>
          {emptyCells}
          {daysInMonth.map((day) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentDay = isSameDay(day, today);

            return (
              <button
                key={day.toISOString()}
                className={`
                  ${styles.day}
                  ${isSelected ? styles.selected : ''}
                  ${isCurrentDay ? styles.today : ''}
                `}
                onClick={() => onSelect(format(day, 'dd-MM-yyyy'))}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.calendarWrapper} ${false ? styles.dark : ''}`}>
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
      <NavLink
        to={RouterLinks.ScheduleBuilder + format(new Date(), 'dd-MM-yyyy')}
        className={styles.goToday}
      >
        {'Сегодня'}
      </NavLink>
    </div>
  );
};

export default observer(ScheduleSelection);
