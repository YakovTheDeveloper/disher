import { memo, useCallback, useMemo } from 'react';
import { parse, isValid } from 'date-fns';
import { drawerStore } from '@/shared/ui';
import { ScheduleSelectionDrawer } from '@/features/ScheduleSelection/ScheduleSelectionDrawer';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { AccountPanel } from '@/features/auth';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import styles from './HomeTopBar.module.scss';

const BAR_VARIANTS = ['floating', 'ribbon'] as const;

type Props = {
  date: string;
  /** Override the date-segment text entirely (bypasses dateVariant rendering). */
  dateButtonLabel?: string;
};

type DateParts = { weekday: string; day: string; month: string; full: string };

const formatDateParts = (input: string): DateParts => {
  const date = parse(input, 'dd-MM-yyyy', new Date());
  if (!isValid(date)) {
    return { weekday: '', day: input, month: '', full: input };
  }
  const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(date);
  const month = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(date);
  const day = String(date.getDate());
  return { weekday, day, month, full: `${weekday} ${day} ${month}` };
};

const DateButtonContent = ({ parts }: { parts: DateParts }) => {
  const { weekday, day, month } = parts;
  return (
    <span className={styles.dateNumeral}>
      <span className={styles.dateNumeralDay}>{day}</span>
      <span className={styles.dateNumeralMeta}>
        <span>{weekday}</span>
        <span>{month}</span>
      </span>
    </span>
  );
};

const HomeTopBar = ({ date, dateButtonLabel }: Props) => {
  const { toScheduleBuilder } = useAppRoutes();
  const dateParts = useMemo(() => formatDateParts(date), [date]);

  const { anchor: barAnchor } = useDesignVariant('HomeTopBar', BAR_VARIANTS);

  const handleDateClick = useCallback(async () => {
    const selectedDate = await drawerStore.show(ScheduleSelectionDrawer, {
      selectedDate: date,
    });
    if (selectedDate && selectedDate !== date) {
      toScheduleBuilder(selectedDate);
    }
  }, [date, toScheduleBuilder]);

  return (
    <div className={styles.shell} {...barAnchor}>
      <div className={styles.bar}>
        <div className={styles.accountSlot}>
          <AccountPanel />
        </div>
        <button
          type="button"
          className={`${styles.segment} ${styles.dateSegment}`}
          onClick={handleDateClick}
          aria-label="Выбрать дату"
        >
          {dateButtonLabel != null ? (
            <span className={styles.dateLabel}>{dateButtonLabel}</span>
          ) : (
            <DateButtonContent parts={dateParts} />
          )}
        </button>
      </div>
    </div>
  );
};

export default memo(HomeTopBar);
