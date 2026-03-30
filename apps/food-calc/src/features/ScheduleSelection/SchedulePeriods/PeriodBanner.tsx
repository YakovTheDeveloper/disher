import { useMemo } from 'react';
import { parse, isWithinInterval } from 'date-fns';
import { usePeriods } from '@/entities/period';
import styles from './PeriodBanner.module.scss';
import { drawerStore } from '@/shared/ui/drawer-store';
import { ScheduleSelectionDrawer } from '@/features/ScheduleSelection/ScheduleSelectionDrawer';

type Props = {
  date: string; // dd-MM-yyyy
};

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

const PeriodBanner = ({ date }: Props) => {
  const allPeriods = usePeriods();

  const activePeriods = useMemo(() => {
    if (!allPeriods?.length) return [];

    const currentDate = parse(date, 'dd-MM-yyyy', new Date());

    return allPeriods.filter((period) => {
      const start = parse(period.startDate, 'dd-MM-yyyy', new Date());
      const end = parse(period.endDate, 'dd-MM-yyyy', new Date());
      return isWithinInterval(currentDate, { start, end });
    });
  }, [allPeriods, date]);

  if (activePeriods.length === 0) return null;

  const openPeriods = () => {
    drawerStore.show(ScheduleSelectionDrawer, { selectedDate: date, initialTab: 'periods' });
  };

  return (
    <div className={styles.container}>
      {activePeriods.map((period) => (
        <button key={period.id} className={styles.banner} onClick={openPeriods}>
          <span
            className={styles.dot}
            style={{ background: COLORS[period.colorIndex] ?? COLORS[0] }}
          />
          <span className={styles.name}>{period.name}</span>
          <span className={styles.arrow}>→</span>
        </button>
      ))}
    </div>
  );
};

export default PeriodBanner;
