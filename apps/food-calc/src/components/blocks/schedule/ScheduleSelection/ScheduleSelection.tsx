import Calendar from '@/components/ui/Calendar/Calendar';
import style from './ScheduleSelection.module.scss';
import { dayNames } from '@/constants';
import { useState } from 'react';
import { Typography } from '@/components/ui/Typography/Typography';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router';
import { scheduleStore } from '@/store/rootStore';

const ScheduleSelection = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const navigate = useNavigate();

  const onPrevMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };

  const onNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  //   const options: Intl.DateTimeFormatOptions = {
  //     weekday: 'long',
  //     year: '2-digit',
  //     month: 'numeric',
  //     day: 'numeric',
  //   };

  const onDateChoose = (date: Date) => {
    const exist = scheduleStore.dateToSchedule.get(date.toISOString());
    if (!exist) {
      navigate(`builder/new?date=${date.toISOString()}`);
      return;
    }
    navigate(`builder/?date=${date.toISOString()}`);
  };

  return (
    <div className={style.container}>
      <Typography>Расписание</Typography>
      <Calendar
        currentMonth={currentMonth}
        onNextMonth={onNextMonth}
        onPrevMonth={onPrevMonth}
        selectedDate={null}
        onDateSelect={onDateChoose}
        dayNames={dayNames.ru}
        cellClassName={style.dateCell}
        renderDayCellContent={(date) => (
          <span>{scheduleStore.dateToSchedule.get(date.toISOString()) && 'есть'}</span>
        )}
      />
    </div>
  );
};

export default observer(ScheduleSelection);
