import React from 'react';
import s from './Calendar.module.css';
import { Typography } from '@/components/ui/Typography/Typography';
import { observer } from 'mobx-react-lite';
import ArrowLeftIcon from '@/assets/icons/arrowLeft.svg';
import ArrowRightIcon from '@/assets/icons/arrowRight.svg';
import { formatDDMMYYYY, parseDDMMYYYY } from '@/lib/time/date';

// Helper function to get the days of a given month and fill calendar grid
const getDaysInMonth = (date: Date): Date[] => {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const days: Date[] = [];

  const prevMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0);
  const prevMonthDays = prevMonthEnd.getDate();

  const startDayOfWeek = startDate.getDay();
  const adjustedStartDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Monday start

  for (let i = adjustedStartDayOfWeek; i >= 0; i--) {
    days.push(new Date(date.getFullYear(), date.getMonth() - 1, prevMonthDays - i));
  }

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const endDayOfWeek = endDate.getDay();
  const remainingDays = 7 - ((endDayOfWeek + 1) % 7);
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(date.getFullYear(), date.getMonth() + 1, i));
  }

  return days;
};

// ✅ Compare day with DD-MM-YYYY string
const isSameDay = (day: Date, dayString: string | null) => {
  if (!dayString) return false;
  return formatDDMMYYYY(day) === dayString;
};

type CalendarProps = {
  currentMonth: Date;
  onDateSelect: (date: string) => void; // 🔒 always DD-MM-YYYY
  selectedDate: string | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  dayNames: string[];
  renderDayCellContent?: (dayDate: Date) => React.ReactNode;
  cellClassName: string;
};

const Calendar: React.FC<CalendarProps> = observer(
  ({
    currentMonth,
    onDateSelect,
    selectedDate,
    onPrevMonth,
    onNextMonth,
    dayNames,
    renderDayCellContent,
    cellClassName,
  }) => {
    const daysInMonth = getDaysInMonth(currentMonth);

    const weeks = [];
    for (let i = 0; i < daysInMonth.length; i += 7) {
      weeks.push(daysInMonth.slice(i, i + 7));
    }

    return (
      <div className={s.calendar}>
        <div className={s.header}>
          <button onClick={onPrevMonth} className={s.headerButton}>
            <ArrowLeftIcon />
          </button>
          <Typography variant="body1">
            {currentMonth.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })}
          </Typography>
          <button onClick={onNextMonth} className={s.headerButton}>
            <ArrowRightIcon />
          </button>
        </div>

        <div className={s.dayNames}>
          {dayNames.map((day) => (
            <Typography key={day} variant="caption" align="center">
              {day}
            </Typography>
          ))}
        </div>

        <div className={s.grid}>
          {weeks.map((week, index) => (
            <div key={index} className={s.week}>
              {week.map((day) => {
                const today = formatDDMMYYYY(new Date());
                const dayKey = formatDDMMYYYY(day);

                return (
                  <div
                    className={`
                    ${cellClassName}
                    ${s.day} 
                    ${day.getMonth() !== currentMonth.getMonth() ? s.otherMonthDay : ''} 
                    ${isSameDay(day, selectedDate) ? s.selectedDay : ''}
                    ${isSameDay(day, today as string) ? s.today : ''}
                  `}
                    onClick={() => onDateSelect(dayKey)}
                    key={dayKey}
                  >
                    {renderDayCellContent ? renderDayCellContent(day) : dayKey}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default Calendar;
