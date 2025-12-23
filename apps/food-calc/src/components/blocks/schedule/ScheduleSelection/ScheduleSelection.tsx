import Calendar from '@/components/ui/Calendar/Calendar';
import style from './ScheduleSelection.module.scss';
import { dayNames } from '@/constants';
import { useCallback, useEffect, useState } from 'react';
import { Typography } from '@/components/ui/Typography/Typography';
import { observer } from 'mobx-react-lite';
import { scheduleStore } from '@/store/rootStore';
import { ScheduleModelStore } from '@/store/models/schedule/scheduleModelStore';
import { ScheduleCalendarContentCell } from '@/components/blocks/schedule/ScheduleSelection/ScheduleCalendarContentCell';

/**
 * ✅ SINGLE SOURCE OF TRUTH FOR DATE FORMAT
 * DD-MM-YYYY
 */
const formatDDMMYYYY = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
};

type Props = {
  /** 🔒 Date is ALWAYS passed as DD-MM-YYYY */
  onDate: (date: string) => void;
  store?: ScheduleModelStore;
};

const ScheduleSelection = ({ store = scheduleStore, onDate }: Props) => {
  /** UI-only Date (allowed) */
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  /** Load month data */
  useEffect(() => {
    store.getAllMonthShortData(currentMonth);
  }, [currentMonth, store]);

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

  /** 🔑 ALL STORE LOOKUPS USE DD-MM-YYYY */
  const getContentExist = useCallback(
    (date: Date) => {
      const key = formatDDMMYYYY(date);
      return store.existing.get(key) || false;
    },
    [store]
  );

  const renderCellContent = useCallback(
    (date: Date) => <ScheduleCalendarContentCell date={date} getContentExist={getContentExist} />,
    [getContentExist]
  );

  /** 🔒 Convert Date → DD-MM-YYYY before leaving component */
  const onDateSelect = (date: string) => {
    onDate(date);
  };

  return (
    <div className={style.container}>
      <Typography>Расписание</Typography>

      <Calendar
        currentMonth={currentMonth}
        onNextMonth={onNextMonth}
        onPrevMonth={onPrevMonth}
        selectedDate={null}
        onDateSelect={onDateSelect}
        dayNames={dayNames.ru}
        cellClassName={style.dateCell}
        renderDayCellContent={renderCellContent}
      />
    </div>
  );
};

export default observer(ScheduleSelection);
