import Calendar from '@/components/ui/Calendar/Calendar';
import style from './ScheduleSelection.module.scss';
import { dayNames } from '@/constants';
import { useCallback, useEffect, useState } from 'react';
import { Typography } from '@/components/ui/Typography/Typography';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router';
import { scheduleStore } from '@/store/rootStore';
import clsx from 'clsx';
import { ScheduleStore } from '@/store/scheduleStore/scheduleStore';
import { ScheduleCalendarContentCell } from '@/components/blocks/schedule/ScheduleSelection/ScheduleCalendarContentCell';

type Props = {
  onDate: (date: Date) => void;
  store?: ScheduleStore;
};

const ScheduleSelection = ({ store = scheduleStore, onDate }: Props) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    store.getAllMonthShortData(currentMonth);
  }, [currentMonth]);

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

  const getContentExist = useCallback(
    (date: Date) => store.existing.get(date.toISOString()) || false,
    [store]
  );

  const renderCellContent = useCallback(
    (date: Date) => <ScheduleCalendarContentCell date={date} getContentExist={getContentExist} />,
    [getContentExist]
  );

  return (
    <div className={style.container}>
      <Typography>Расписание</Typography>
      <Calendar
        currentMonth={currentMonth}
        onNextMonth={onNextMonth}
        onPrevMonth={onPrevMonth}
        selectedDate={null}
        onDateSelect={onDate}
        dayNames={dayNames.ru}
        cellClassName={style.dateCell}
        renderDayCellContent={renderCellContent}
      />
    </div>
  );
};

export default observer(ScheduleSelection);
